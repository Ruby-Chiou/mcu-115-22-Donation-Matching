import { Injectable, inject, signal } from '@angular/core';

import { AuthSessionService } from '../auth/auth-session.service';
import { SupabaseService } from '../database/supabase.service';

export interface AgencyAccessGrant {
  id: number;
  agencyUid: string;
  adminUid: string;
  adminName: string;
  reason: string;
  clientLabel: string;
  clientIp: string;
  operatorName: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: string;
  decidedAt: string | null;
  expiresAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AgencyAccessService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthSessionService);
  private cache: { at: number; grant: AgencyAccessGrant | null } | null = null;

  readonly incoming = signal<AgencyAccessGrant[]>([]);
  readonly leaveNotice = signal('');

  async activeGrant(force = false): Promise<AgencyAccessGrant | null> {
    if (this.auth.principal().role !== 'admin') {
      return null;
    }

    if (!force && this.cache && Date.now() - this.cache.at < 15000) {
      return this.cache.grant;
    }

    const uid = this.auth.principal().userId;
    if (!uid) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('agency_access_grants')
      .select('id, agency_uid, admin_uid, admin_name, reason, client_label, client_ip, operator_name, status, requested_at, decided_at, expires_at')
      .eq('admin_uid', uid)
      .in('status', ['pending', 'approved'])
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    const grants = (data ?? []).map((row) => this.map(row as Record<string, unknown>));
    const grant = grants.find((item) => item.status === 'approved' && this.stillOpen(item)) ?? grants.find((item) => item.status === 'pending') ?? null;
    this.cache = { at: Date.now(), grant };
    return grant;
  }

  async incomingForAgency(): Promise<AgencyAccessGrant[]> {
    if (this.auth.principal().role !== 'agency') {
      this.incoming.set([]);
      return [];
    }

    const uid = this.auth.principal().userId;
    if (!uid) {
      this.incoming.set([]);
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('agency_access_grants')
      .select('id, agency_uid, admin_uid, admin_name, reason, client_label, client_ip, operator_name, status, requested_at, decided_at, expires_at')
      .eq('agency_uid', uid)
      .in('status', ['pending', 'approved'])
      .order('requested_at', { ascending: false });

    if (error) {
      throw error;
    }

    const grants = (data ?? []).map((row) => this.map(row as Record<string, unknown>)).filter((item) => item.status === 'pending' || this.stillOpen(item));
    this.incoming.set(grants);
    return grants;
  }

  noteLeave(text: string): void {
    this.cache = null;
    this.leaveNotice.set(text);
  }

  async request(agencyUid: string, reason: string, operatorName: string, operatorPassword: string): Promise<AgencyAccessGrant> {
    const { data, error } = await this.supabase.client.rpc('request_agency_access', {
      p_agency_uid: agencyUid,
      p_reason: reason.trim(),
      p_client_label: describeAccessClient(),
      p_operator_name: operatorName.trim(),
      p_operator_password: operatorPassword,
    });

    if (error) {
      throw new Error(message(error.message));
    }

    this.cache = null;
    return this.map(data as Record<string, unknown>);
  }

  async decide(id: number, accept: boolean): Promise<void> {
    const { error } = await this.supabase.client.rpc('decide_agency_access', {
      p_id: id,
      p_accept: accept,
    });

    if (error) {
      throw new Error(message(error.message));
    }

    this.cache = null;
    await this.incomingForAgency();
  }

  async revoke(id: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('revoke_agency_access', { p_id: id });

    if (error) {
      throw new Error(message(error.message));
    }

    this.cache = null;
  }

  stillOpen(grant: AgencyAccessGrant): boolean {
    return grant.status === 'approved' && !!grant.expiresAt && new Date(grant.expiresAt).getTime() > Date.now();
  }

  private map(row: Record<string, unknown>): AgencyAccessGrant {
    const status = String(row['status'] ?? 'pending');
    return {
      id: Number(row['id']),
      agencyUid: String(row['agency_uid'] ?? ''),
      adminUid: String(row['admin_uid'] ?? ''),
      adminName: String(row['admin_name'] ?? ''),
      reason: String(row['reason'] ?? ''),
      clientLabel: String(row['client_label'] ?? ''),
      clientIp: String(row['client_ip'] ?? ''),
      operatorName: String(row['operator_name'] ?? ''),
      status: status === 'approved' || status === 'rejected' || status === 'revoked' ? status : 'pending',
      requestedAt: String(row['requested_at'] ?? ''),
      decidedAt: row['decided_at'] ? String(row['decided_at']) : null,
      expiresAt: row['expires_at'] ? String(row['expires_at']) : null,
    };
  }
}

/** 瀏覽器自己報的系統與名稱，用來讓受助者辨認是哪一台提出申請。這不是密碼，也不能證明實體裝置。 */
export function describeAccessClient(): string {
  if (typeof navigator === 'undefined') {
    return '';
  }

  const ua = navigator.userAgent;
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS|Macintosh/.test(ua)
      ? 'Mac'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iPhone 或 iPad'
          : '其他系統';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '瀏覽器';
  return `${os} · ${browser}`.slice(0, 80);
}

function message(raw: string): string {
  const text = raw.replace(/^.*?:\s*/, '');
  return text || '這次接入沒有完成。';
}
