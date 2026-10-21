import { Injectable, inject, signal } from '@angular/core';

import { AgencyCertificate } from '../../../models/member/agency-certificate';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface AgencyCertificateRow {
  id: number | string;
  donorUid: string;
  agencyName: string | null;
  donationItem: string | null;
  donationDate: string | null;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  note: string | null;
  uploadedAt: string | null;
  donationId: string | null;
}

/** 機構上傳感謝狀：只負責讀取與展示，檔案內容不由系統排版 */
@Injectable({
  providedIn: 'root',
})
export class AgencyCertificateService {
  private readonly tableName = 'agency_uploaded_certificates';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly certificatesSignal = signal<AgencyCertificate[]>([]);
  readonly certificates = this.certificatesSignal.asReadonly();

  async loadCertificates(): Promise<AgencyCertificate[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('donorUid', uid)
      .order('uploadedAt', { ascending: false });

    if (error) {
      console.error('讀取機構感謝狀失敗：', error);
      throw error;
    }

    const certificates = (data ?? []).map((row) => this.mapRow(row as AgencyCertificateRow));
    this.certificatesSignal.set(certificates);

    return certificates;
  }

  private mapRow(row: AgencyCertificateRow): AgencyCertificate {
    return {
      id: Number(row.id),
      donorUid: row.donorUid,
      agencyName: row.agencyName ?? '',
      donationItem: row.donationItem ?? '',
      donationDate: row.donationDate ?? '',
      fileUrl: row.fileUrl,
      fileName: row.fileName ?? '感謝狀檔案',
      mimeType: row.mimeType ?? 'application/pdf',
      note: row.note ?? '',
      uploadedAt: row.uploadedAt ?? '',
      donationId: row.donationId ?? undefined,
    };
  }
}
