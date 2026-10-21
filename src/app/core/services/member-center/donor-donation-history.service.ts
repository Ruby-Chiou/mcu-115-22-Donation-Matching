import { Injectable, inject, signal } from '@angular/core';

import { DonationStatus } from '../../../models/agency/item-review';
import { DonorDonationHistory } from '../../../models/member/donation-history';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface DonationHistoryRow {
  id: string;
  donor_uid: string | null;
  demand_id: number;
  actual_material: string | null;
  quantity: number | null;
  donation_method: string | null;
  status: DonationStatus;
  ai_decision: string | null;
  ai_reason: string | null;
  human_decision: string | null;
  human_reason: string | null;
  need_receipt: boolean | null;
  need_thank_you: boolean | null;
  note: string | null;
  created_at: string;
  ai_checked_at: string | null;
  human_checked_at: string | null;
  tracking_no: string | null;
}

interface DemandMetaRow {
  id: number;
  item: string | null;
  category: string | null;
  recipient: string | null;
  address: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DonorDonationHistoryService {
  private readonly donationTable = 'donor_daily_donations';
  private readonly demandTable = 'agency_daily_supply_items';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly recordsSignal = signal<DonorDonationHistory[]>([]);
  readonly records = this.recordsSignal.asReadonly();

  async loadHistory(): Promise<DonorDonationHistory[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.donationTable)
      .select(
        `
        id,
        donor_uid,
        demand_id,
        actual_material,
        quantity,
        donation_method,
        status,
        ai_decision,
        ai_reason,
        human_decision,
        human_reason,
        need_receipt,
        need_thank_you,
        note,
        created_at,
        ai_checked_at,
        human_checked_at,
        tracking_no
      `
      )
      .eq('donor_uid', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取個人捐助歷史失敗：', error);
      throw error;
    }

    const rows = (data ?? []) as DonationHistoryRow[];
    const demandMap = await this.loadDemandMeta(rows.map((row) => row.demand_id));

    const records = rows.map((row) => this.mapRow(row, demandMap.get(row.demand_id)));
    this.recordsSignal.set(records);

    return records;
  }

  private async loadDemandMeta(demandIds: number[]): Promise<Map<number, DemandMetaRow>> {
    const uniqueIds = [...new Set(demandIds.filter((id) => Number.isInteger(id) && id > 0))];
    const map = new Map<number, DemandMetaRow>();

    if (uniqueIds.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseService.client
      .from(this.demandTable)
      .select('id, item, category, recipient, address')
      .in('id', uniqueIds);

    if (error) {
      console.error('讀取需求資料失敗：', error);
      return map;
    }

    for (const row of (data ?? []) as DemandMetaRow[]) {
      map.set(row.id, row);
    }

    return map;
  }

  private mapRow(row: DonationHistoryRow, demand?: DemandMetaRow): DonorDonationHistory {
    return {
      id: row.id,
      donorUid: row.donor_uid ?? '',
      demandId: row.demand_id,
      demandItem: demand?.item ?? '（需求已移除）',
      demandCategory: demand?.category ?? '',
      recipient: demand?.recipient ?? '',
      address: demand?.address ?? '',
      actualMaterial: row.actual_material ?? '',
      quantity: row.quantity ?? 0,
      donationMethod: row.donation_method ?? '',
      status: row.status,
      aiDecision: row.ai_decision,
      aiReason: row.ai_reason,
      humanDecision: row.human_decision,
      humanReason: row.human_reason,
      needReceipt: !!row.need_receipt,
      needThankYou: !!row.need_thank_you,
      note: row.note ?? '',
      createdAt: row.created_at,
      aiCheckedAt: row.ai_checked_at,
      humanCheckedAt: row.human_checked_at,
      trackingNo: row.tracking_no ?? '',
    };
  }

  /** 審核已通過的寄送捐助，才能補上物流單號 */
  async saveTrackingNumber(donationId: string, trackingNo: string): Promise<void> {
    const uid = await this.session.getCurrentUid();
    const trimmed = trackingNo.trim();

    if (!trimmed) {
      throw new Error('請輸入物流單號');
    }

    const { error } = await this.supabaseService.client.rpc('upload_donation_tracking', {
      p_donation_id: donationId,
      p_donor_uid: uid,
      p_tracking: trimmed,
    });

    if (error) {
      console.error('上傳物流單號失敗：', error);
      throw new Error('只有審核通過的寄送捐助可以上傳物流單號');
    }

    this.recordsSignal.update((records) =>
      records.map((record) => (record.id === donationId ? { ...record, trackingNo: trimmed } : record))
    );
  }
}
