import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import {
  AuthPrincipal,
  CompanyReviewStatus,
  DonorKind,
  GUEST_PRINCIPAL,
  LoginPortal,
  isAppRole,
} from '../../../models/auth/app-role';
import { clearOAuthPersistence, setAuthPersistence } from '../../auth/auth-storage';
import { SupabaseService } from '../database/supabase.service';

interface AccountRow {
  user_id: string;
  email: string;
  display_name: string;
  role: LoginPortal;
  donorKind: DonorKind;
  companyStatus: CompanyReviewStatus | null;
  companyReviewNote: string;
}

/**
 * 登入工作階段。身分別只讀資料庫的 user_accounts，不讀使用者可自行修改的 user_metadata。
 */
@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly supabase = inject(SupabaseService);
  private readonly zone = inject(NgZone);

  readonly principal = signal<AuthPrincipal>(GUEST_PRINCIPAL);
  /** 點了重設密碼信後，需在站內設定新密碼。 */
  readonly passwordRecovery = signal(false);

  private restorePromise: Promise<void> | null = null;
  private accountError: Error | null = null;

  restore(): Promise<void> {
    this.restorePromise ??= this.restoreOnce();
    return this.restorePromise;
  }

  async signIn(email: string, password: string, remember: boolean): Promise<void> {
    setAuthPersistence(remember);
    this.accountError = null;

    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    await this.applySession(data.session);
    await this.enterZone();

    if (this.principal().role === 'guest') {
      const reason = this.accountError;
      await this.signOut();
      await this.enterZone();
      throw reason ?? new Error('此帳號尚未設定身分，請聯絡系統管理員。');
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.client.auth.signOut();
    } finally {
      this.principal.set(GUEST_PRINCIPAL);
    }
  }

  private async restoreOnce(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    await this.applySession(data.session);
    if (data.session?.user) {
      clearOAuthPersistence();
    }

    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.zone.run(() => {
        if (event === 'PASSWORD_RECOVERY') {
          this.passwordRecovery.set(true);
        }

        void this.applySession(session).then(() => {
          if (session?.user) {
            clearOAuthPersistence();
          }
        });
      });
    });
  }

  async updateRecoveredPassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    this.passwordRecovery.set(false);
  }

  private async applySession(session: Session | null): Promise<void> {
    if (!session?.user) {
      this.principal.set(GUEST_PRINCIPAL);
      return;
    }

    try {
      const account = await this.loadAccount(session.user.id);

      if (!account) {
        this.accountError = new Error('此帳號尚未設定身分，請聯絡系統管理員。');
        this.principal.set(GUEST_PRINCIPAL);
        return;
      }

      if (account.role === 'agency') {
        const block = await this.agencyBlockReason(session.user.id);
        if (block) {
          this.accountError = new Error(block);
          this.principal.set(GUEST_PRINCIPAL);
          await this.supabase.client.auth.signOut();
          return;
        }
      }

      if (account.role === 'donor') {
        const block = await this.donorBlockReason(session.user.id);
        if (block) {
          this.accountError = new Error(block);
          this.principal.set(GUEST_PRINCIPAL);
          await this.supabase.client.auth.signOut();
          return;
        }
      }

      this.accountError = null;
      this.principal.set({
        role: account.role,
        userId: session.user.id,
        email: account.email || session.user.email || '',
        displayName: account.display_name || account.email || '會員',
        donorKind: account.role === 'donor' ? account.donorKind : null,
        companyStatus: account.companyStatus,
        companyReviewNote: account.companyReviewNote,
      });
    } catch (error) {
      this.accountError = error instanceof Error ? error : new Error('無法確認登入身分，請稍後再試。');
      this.principal.set(GUEST_PRINCIPAL);
    }
  }

  private async loadAccount(userId: string): Promise<AccountRow | null> {
    const { data, error } = await this.supabase.client
      .from('user_accounts')
      .select('user_id, email, display_name, role, donor_kind')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || /user_accounts/i.test(error.message)) {
        throw new Error('身分資料尚未建立，請先套用資料庫更新。');
      }

      throw new Error('無法確認登入身分，請稍後再試。');
    }

    const row = data as {
      user_id: string;
      email: string;
      display_name: string;
      role: string;
      donor_kind?: string;
    } | null;

    if (!row || !isAppRole(row.role) || row.role === 'guest') {
      return null;
    }

    const donorKind: DonorKind = row.donor_kind === 'company' ? 'company' : 'individual';
    const company = donorKind === 'company' ? await this.loadCompanyReview(row.user_id) : null;

    return {
      user_id: row.user_id,
      email: row.email,
      display_name: row.display_name,
      role: row.role,
      donorKind,
      companyStatus: company?.status ?? null,
      companyReviewNote: company?.review_note ?? '',
    };
  }

  private async loadCompanyReview(userId: string): Promise<{ status: CompanyReviewStatus; review_note: string } | null> {
    const { data, error } = await this.supabase.client
      .from('donor_company_applications')
      .select('status, review_note')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error('無法確認企業審核狀態，請稍後再試。');
    }

    const row = data as { status: string; review_note: string } | null;
    if (!row || !isCompanyStatus(row.status)) {
      return { status: 'pending', review_note: '' };
    }

    return { status: row.status, review_note: row.review_note ?? '' };
  }

  private enterZone(): Promise<void> {
    if (NgZone.isInAngularZone()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => this.zone.run(() => resolve()));
  }

  private async donorBlockReason(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('donor_profiles')
      .select('accountStatus')
      .eq('uid', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    if (data.accountStatus === 'SUSPENDED') {
      return '此捐助帳號已停用，請聯絡平台管理者。';
    }

    if (data.accountStatus === 'DELETED') {
      return '此捐助帳號已註銷。';
    }

    return null;
  }

  private async agencyBlockReason(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('agency_profiles')
      .select('verificationStatus, reviewNote, accountStatus')
      .eq('uid', userId)
      .maybeSingle();

    if (error) {
      return '無法確認機構審核狀態，請稍後再試。';
    }

    const status = data?.verificationStatus ?? 'pending';
    const note = (data?.reviewNote ?? '').trim();

    if (data?.accountStatus === 'DELETED') {
      return note ? `此機構帳號已註銷。${note}` : '此機構帳號已註銷，不能再登入。';
    }

    if (status === 'approved') {
      return null;
    }

    if (status === 'rejected') {
      return note ? `機構資格未通過。${note}` : '機構資格未通過，目前不能登入。';
    }

    if (status === 'supplement') {
      return note ? `機構資格需要補件後才能登入。${note}` : '機構資格需要補件後才能登入。';
    }

    return '機構資格還在審核，通過後才能登入使用。';
  }
}

function isCompanyStatus(value: string): value is CompanyReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'supplement';
}
