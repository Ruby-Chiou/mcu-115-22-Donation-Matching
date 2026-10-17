import { Injectable, inject, signal } from '@angular/core';

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
  donationItem: string | null;
  donationDate: string | null;
  issuedAt: string | null;
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
    return {
      id: Number(row.id),
      receiptNo: row.receiptNo,
      donorUid: row.donorUid,
      donorName: row.donorName ?? '',
      receiptTitle: row.receiptTitle ?? '',
      agencyName: row.agencyName ?? '',
      donationItem: row.donationItem ?? '',
      donationDate: row.donationDate ?? '',
      issuedAt: row.issuedAt ?? '',
    };
  }
}
