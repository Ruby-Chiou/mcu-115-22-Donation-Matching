import { Injectable, inject, signal } from '@angular/core';

import { DonationCertificate } from '../../../models/member/donation-certificate';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface DonationCertificateRow {
  id: number | string;
  certificateNo: string;
  donorUid: string;
  donorName: string | null;
  agencyName: string | null;
  agencyRepresentative: string | null;
  donationItem: string | null;
  donationDate: string | null;
  message: string | null;
  issuedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DonationCertificateService {
  private readonly tableName = 'donor_certificates';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly certificatesSignal = signal<DonationCertificate[]>([]);
  readonly certificates = this.certificatesSignal.asReadonly();

  async loadCertificates(): Promise<DonationCertificate[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('donorUid', uid)
      .order('issuedAt', { ascending: false });

    if (error) {
      console.error('讀取感謝狀失敗：', error);
      throw error;
    }

    const certificates = (data ?? []).map((row) => this.mapRowToCertificate(row as DonationCertificateRow));
    this.certificatesSignal.set(certificates);

    return certificates;
  }

  private mapRowToCertificate(row: DonationCertificateRow): DonationCertificate {
    return {
      id: Number(row.id),
      certificateNo: row.certificateNo,
      donorUid: row.donorUid,
      donorName: row.donorName ?? '',
      agencyName: row.agencyName ?? '',
      agencyRepresentative: row.agencyRepresentative ?? '',
      donationItem: row.donationItem ?? '',
      donationDate: row.donationDate ?? '',
      message: row.message ?? '',
      issuedAt: row.issuedAt ?? '',
    };
  }
}
