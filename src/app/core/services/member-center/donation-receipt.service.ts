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
  agencyNameEn: string | null;
  orgTaxId: string | null;
  approvalNo: string | null;
  donorIdNo: string | null;
  donorAddress: string | null;
  donorPhone: string | null;
  donationItem: string | null;
  donationDate: string | null;
  note: string | null;
  accountName: string | null;
  postalAccount: string | null;
  orgPhone: string | null;
  orgFax: string | null;
  orgEmail: string | null;
  orgAddress: string | null;
  handlerName: string | null;
  issuedAt: string | null;
  donationId: string | null;
  largeSealUrl: string | null;
  smallSealUrl: string | null;
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
      agencyNameEn: row.agencyNameEn ?? '',
      orgTaxId: row.orgTaxId ?? '',
      approvalNo: row.approvalNo ?? '',
      donorIdNo: row.donorIdNo ?? '',
      donorAddress: row.donorAddress ?? '',
      donorPhone: row.donorPhone ?? '',
      donationItem: row.donationItem ?? '',
      donationDate: row.donationDate ?? '',
      note: row.note ?? '',
      accountName: row.accountName ?? '',
      postalAccount: row.postalAccount ?? '',
      orgPhone: row.orgPhone ?? '',
      orgFax: row.orgFax ?? '',
      orgEmail: row.orgEmail ?? '',
      orgAddress: row.orgAddress ?? '',
      handlerName: row.handlerName ?? '',
      issuedAt: row.issuedAt ?? '',
      donationId: row.donationId ?? undefined,
      largeSealUrl: row.largeSealUrl ?? '',
      smallSealUrl: row.smallSealUrl ?? '',
    };
  }
}
