import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';

export type DonorAdminStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface DonorAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  fullName: string;
  phone: string;
  city: string;
  donorKind: 'individual' | 'company' | '';
  loginProvider: string;
  accountStatus: DonorAdminStatus;
  createdAt: string;
  hasProfile: boolean;
}

interface ProfileRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  city: string | null;
  loginProvider: string | null;
  accountStatus: string | null;
  createdAt: string | null;
}

interface AccountRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  donor_kind: string | null;
  created_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DonorAccountAdminService {
  private readonly supabase = inject(SupabaseService);

  async list(): Promise<DonorAccountRecord[]> {
    const [profiles, accounts] = await Promise.all([this.loadProfiles(), this.loadAccounts()]);
    const byUid = new Map<string, DonorAccountRecord>();

    for (const account of accounts) {
      byUid.set(account.user_id, {
        uid: account.user_id,
        email: account.email ?? '',
        displayName: account.display_name ?? '',
        fullName: '',
        phone: '',
        city: '',
        donorKind: account.donor_kind === 'company' ? 'company' : 'individual',
        loginProvider: '',
        accountStatus: 'ACTIVE',
        createdAt: account.created_at ?? '',
        hasProfile: false,
      });
    }

    for (const profile of profiles) {
      const existing = byUid.get(profile.uid);
      byUid.set(profile.uid, {
        uid: profile.uid,
        email: profile.email || existing?.email || '',
        displayName: profile.displayName || existing?.displayName || '',
        fullName: profile.fullName ?? '',
        phone: profile.phoneNumber ?? '',
        city: profile.city ?? '',
        donorKind: existing?.donorKind ?? '',
        loginProvider: profile.loginProvider ?? '',
        accountStatus: this.statusOf(profile.accountStatus),
        createdAt: profile.createdAt || existing?.createdAt || '',
        hasProfile: true,
      });
    }

    return [...byUid.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async setStatus(record: DonorAccountRecord, accountStatus: DonorAdminStatus): Promise<void> {
    const updatedAt = new Date().toISOString();
    const deletedAt = accountStatus === 'DELETED' ? updatedAt : null;

    if (record.hasProfile) {
      const { error } = await this.supabase.client
        .from('donor_profiles')
        .update({ accountStatus, updatedAt, deletedAt })
        .eq('uid', record.uid);

      if (error) {
        throw error;
      }
      return;
    }

    const { error } = await this.supabase.client.from('donor_profiles').insert({
      uid: record.uid,
      email: record.email,
      displayName: record.displayName || record.email || '捐助者',
      accountStatus,
      updatedAt,
      deletedAt,
    });

    if (error) {
      throw error;
    }
  }

  private async loadProfiles(): Promise<ProfileRow[]> {
    const { data, error } = await this.supabase.client
      .from('donor_profiles')
      .select('uid, email, displayName, fullName, phoneNumber, city, loginProvider, accountStatus, createdAt');

    if (error) {
      throw error;
    }

    return (data ?? []) as ProfileRow[];
  }

  private async loadAccounts(): Promise<AccountRow[]> {
    const { data, error } = await this.supabase.client
      .from('user_accounts')
      .select('user_id, email, display_name, donor_kind, created_at')
      .eq('role', 'donor');

    if (error) {
      console.error('讀取捐助者帳號失敗：', error);
      return [];
    }

    return (data ?? []) as AccountRow[];
  }

  private statusOf(value: string | null): DonorAdminStatus {
    if (value === 'SUSPENDED' || value === 'DELETED') {
      return value;
    }
    return 'ACTIVE';
  }
}
