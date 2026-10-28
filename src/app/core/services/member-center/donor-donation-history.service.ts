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
  thank_name_mode: string | null;
  thank_public: boolean | null;
  note: string | null;
  created_at: string;
  ai_checked_at: string | null;
  human_checked_at: string | null;
  logistics_carrier: string | null;
  tracking_no: string | null;
  receipt_confirmed_at: string | null;
  receipt_partial: boolean | null;
  receipt_declined_video: boolean | null;
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
        thank_name_mode,
        thank_public,
        note,
        created_at,
        ai_checked_at,
        human_checked_at,
        logistics_carrier,
        tracking_no,
        receipt_confirmed_at,
        receipt_partial,
        receipt_declined_video
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
      thankNameMode: row.thank_name_mode === 'full' ? 'full' : 'masked',
      thankPublic: row.thank_public !== false,
      note: row.note ?? '',
      createdAt: row.created_at,
      aiCheckedAt: row.ai_checked_at,
      humanCheckedAt: row.human_checked_at,
      logisticsCarrier: row.logistics_carrier ?? '',
      trackingNo: row.tracking_no ?? '',
      receiptConfirmedAt: row.receipt_confirmed_at,
      receiptPartial: !!row.receipt_partial,
      receiptDeclinedVideo: !!row.receipt_declined_video,
    };
  }

  canRevise(record: DonorDonationHistory): boolean {
    return (
      record.status === 'pending_ai_review' ||
      record.status === 'pending_human_review' ||
      record.status === 'needs_supplement'
    );
  }

  /** 需補件或機構未通過：同一筆補圖後再送審，不必重跑申請。 */
  canSupplement(record: DonorDonationHistory): boolean {
    return record.status === 'needs_supplement' || record.status === 'human_rejected';
  }

  async updatePendingDonation(
    donationId: string,
    patch: { actualMaterial: string; quantity: number; note: string; donationMethod: string },
  ): Promise<void> {
    const uid = await this.session.getCurrentUid();
    const material = patch.actualMaterial.trim();
    const quantity = Math.max(1, Math.floor(Number(patch.quantity) || 0));
    const method = patch.donationMethod.trim();

    if (!material) {
      throw new Error('請填寫實際物資名稱');
    }

    if (!method) {
      throw new Error('請選擇捐贈方式');
    }

    const { data, error } = await this.supabaseService.client
      .from(this.donationTable)
      .update({
        actual_material: material,
        quantity,
        note: patch.note.trim(),
        donation_method: method,
      })
      .eq('id', donationId)
      .eq('donor_uid', uid)
      .in('status', ['pending_ai_review', 'pending_human_review', 'needs_supplement'])
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(error.message || '無法更新這筆審核中的捐助');
    }

    if (!data) {
      throw new Error('只有尚未結案或需補件的捐助可以修改');
    }

    this.recordsSignal.update((records) =>
      records.map((record) =>
        record.id === donationId
          ? { ...record, actualMaterial: material, quantity, note: patch.note.trim(), donationMethod: method }
          : record,
      ),
    );
  }

  async withdrawPendingDonation(donationId: string): Promise<void> {
    const uid = await this.session.getCurrentUid();
    const { data, error } = await this.supabaseService.client
      .from(this.donationTable)
      .delete()
      .eq('id', donationId)
      .eq('donor_uid', uid)
      .in('status', ['pending_ai_review', 'pending_human_review', 'needs_supplement'])
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(error.message || '無法撤回這筆捐助');
    }

    if (!data) {
      throw new Error('只有尚未結案或需補件的捐助可以撤回');
    }

    this.recordsSignal.update((records) => records.filter((record) => record.id !== donationId));
  }

  async resubmitAfterSupplement(donationId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client.rpc('resubmit_donation_after_supplement', {
      p_donation_id: donationId,
    });

    if (error) {
      throw new Error(error.message || '補件送審失敗，請確認已上傳物資照片');
    }

    const status = (data as { status?: string } | null)?.status ?? 'pending_ai_review';

    this.recordsSignal.update((records) =>
      records.map((record) =>
        record.id === donationId
          ? {
              ...record,
              status: status as DonationStatus,
              aiDecision: null,
              aiReason: null,
              aiCheckedAt: null,
              humanDecision: null,
              humanReason: null,
              humanCheckedAt: null,
            }
          : record,
      ),
    );
  }

  /** 審核已通過的寄送捐助，才能由捐助者補上物流公司與單號 */
  async saveTrackingNumber(donationId: string, trackingNo: string, logisticsCarrier: string): Promise<void> {
    const uid = await this.session.getCurrentUid();
    const trimmed = trackingNo.trim();
    const carrier = logisticsCarrier.trim();

    if (!carrier) {
      throw new Error('請選擇物流公司');
    }

    if (!trimmed) {
      throw new Error('請輸入物流單號');
    }

    const { error } = await this.supabaseService.client.rpc('upload_donation_tracking', {
      p_donation_id: donationId,
      p_donor_uid: uid,
      p_tracking: trimmed,
      p_carrier: carrier,
    });

    if (error) {
      console.error('上傳物流資料失敗：', error);
      throw new Error(error.message || '只有審核通過的寄送捐助可以上傳物流資料');
    }

    this.recordsSignal.update((records) =>
      records.map((record) =>
        record.id === donationId ? { ...record, trackingNo: trimmed, logisticsCarrier: carrier } : record
      )
    );
  }
}
