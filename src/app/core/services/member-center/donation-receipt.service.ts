import { Injectable, inject, signal } from '@angular/core';

import { parseReceiptLines, readReceiptLogistics } from '../../receipt/donation-receipt-document';
import { DonationReceipt } from '../../../models/member/donation-receipt';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface DonationReceiptRow {
  id: number | string;
  receiptNo: string;
  donorUid: string;
  donorName: string | null;
  receiptTitle: string | null;
  agencyName: string | null;
  donorIdNo: string | null;
  donorPhone: string | null;
  donorEmail: string | null;
  donationItem: string | null;
  donationDate: string | null;
  orgPhone: string | null;
  orgAddress: string | null;
  issuedAt: string | null;
  donationId: string | null;
  largeSealUrl: string | null;
  smallSealUrl: string | null;
  lineItems: unknown;
  handoverMethod: string | null;
  completedOn: string | null;
  note: string | null;
  pdfUrl: string | null;
  pdfFileName: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DonationReceiptService {
  private readonly tableName = 'donor_receipts';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly receiptsSignal = signal<DonationReceipt[]>([]);
  readonly receipts = this.receiptsSignal.asReadonly();

  async loadReceipts(): Promise<DonationReceipt[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('donorUid', uid)
      .order('issuedAt', { ascending: false });

    if (error) {
      console.error('讀取捐贈收據失敗：', error);
      throw error;
    }

    const receipts = (data ?? []).map((row) => this.mapRow(row as DonationReceiptRow));
    this.receiptsSignal.set(receipts);

    return receipts;
  }

  private mapRow(row: DonationReceiptRow): DonationReceipt {
    const issuedAt = row.issuedAt ?? '';

    return {
      id: Number(row.id),
      receiptNo: row.receiptNo,
      donorUid: row.donorUid,
      donorName: row.donorName ?? '',
      donorPhone: row.donorPhone ?? '',
      donorEmail: row.donorEmail ?? '',
      receiptTitle: row.receiptTitle ?? '',
      agencyName: row.agencyName ?? '',
      agencyAddress: row.orgAddress ?? '',
      agencyPhone: row.orgPhone ?? '',
      ...readReceiptLogistics(row.note),
      lines: parseReceiptLines(row.lineItems, row.donationItem ?? ''),
      handoverMethod: row.handoverMethod ?? '',
      completedOn: (row.completedOn || row.donationDate || '').slice(0, 10),
      issuedOn: issuedAt.slice(0, 10),
      orgSealUrl: row.largeSealUrl ?? '',
      officerSealUrl: row.smallSealUrl ?? '',
      donorIdNo: row.donorIdNo ?? '',
      issuedAt,
      donationId: row.donationId ?? undefined,
      pdfUrl: row.pdfUrl ?? '',
      pdfFileName: row.pdfFileName ?? '',
    };
  }
}
