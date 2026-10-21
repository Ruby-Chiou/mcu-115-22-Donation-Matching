import { Injectable, inject, signal } from '@angular/core';

import { DonationBroadcast, PublicDonationThank, maskDonorName, publicDonationItem } from '../../../models/member/public-donation-thank';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface PublicDonationThankRow {
  id: number | string;
  donorUid: string;
  displayName: string | null;
  honorific: string | null;
  donationItem: string | null;
  agencyName: string | null;
  publishedAt: string | null;
  isPublic: boolean | null;
  donationId: string | null;
}

/** 系統公開感謝（感謝牆資料來源之一）；會員專區只列出屬於自己的公開條目 */
@Injectable({
  providedIn: 'root',
})
export class PublicDonationThankService {
  private readonly tableName = 'public_donation_thanks';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly thanksSignal = signal<PublicDonationThank[]>([]);
  readonly thanks = this.thanksSignal.asReadonly();

  private readonly wallSignal = signal<PublicDonationThank[]>([]);
  readonly wall = this.wallSignal.asReadonly();

  private wallRequest: Promise<PublicDonationThank[]> | null = null;

  private readonly broadcastSignal = signal<DonationBroadcast[]>([]);
  readonly broadcasts = this.broadcastSignal.asReadonly();

  async loadMyPublicThanks(): Promise<PublicDonationThank[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('donorUid', uid)
      .eq('isPublic', true)
      .order('publishedAt', { ascending: false });

    if (error) {
      console.error('讀取公開感謝失敗：', error);
      throw error;
    }

    const thanks = (data ?? []).map((row) => this.mapRow(row as PublicDonationThankRow));
    this.thanksSignal.set(thanks);

    return thanks;
  }

  /** 感謝牆與頁首跑馬燈共用的公開清單 */
  loadWall(): Promise<PublicDonationThank[]> {
    if (!this.wallRequest) {
      this.wallRequest = this.fetchWall().finally(() => {
        this.wallRequest = null;
      });
    }

    return this.wallRequest;
  }

  /** 全域跑馬燈：物資審核已通過，而且捐助者已上傳物流單號。最多 5 筆。 */
  async loadBroadcasts(): Promise<DonationBroadcast[]> {
    const { data, error } = await this.supabaseService.client
      .from('donor_daily_donations')
      .select('id, donor_name, actual_material, tracking_no, tracking_uploaded_at')
      .eq('status', 'human_approved')
      .not('tracking_no', 'is', null)
      .order('tracking_uploaded_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('讀取跑馬燈失敗：', error);
      throw error;
    }

    const broadcasts = (data ?? [])
      .filter((row) => String(row.tracking_no ?? '').trim().length > 0)
      .map((row) => ({
        id: String(row.id),
        displayName: maskDonorName(row.donor_name ?? ''),
        donationItem: publicDonationItem(row.actual_material ?? ''),
      }));

    this.broadcastSignal.set(broadcasts);

    return broadcasts;
  }

  /**
   * 機構接受捐助後公開一筆感謝。姓名會遮罩，同一筆捐助不會重複公開。
   */
  async publishApprovedDonation(donationId: string): Promise<void> {
    const { data: donation, error } = await this.supabaseService.client
      .from('donor_daily_donations')
      .select('id, donor_uid, donor_name, actual_material, human_checked_at')
      .eq('id', donationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const donorUid = (donation?.donor_uid ?? '').trim();

    if (!donation || !donorUid) {
      return;
    }

    const { data: existing, error: existingError } = await this.supabaseService.client
      .from(this.tableName)
      .select('id')
      .eq('donationId', donationId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return;
    }

    const row = {
      donorUid,
      displayName: maskDonorName(donation.donor_name ?? ''),
      honorific: '',
      donationItem: publicDonationItem(donation.actual_material ?? ''),
      agencyName: '示範社福機構',
      isPublic: true,
      donationId,
      publishedAt: donation.human_checked_at ?? new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await this.supabaseService.client
      .from(this.tableName)
      .insert(row)
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    this.prependWall(this.mapRow(inserted as PublicDonationThankRow));
  }

  /** 收據上的機構與捐贈內容寫回同一筆公開感謝 */
  async syncFromReceipt(donationId: string, agencyName: string, donationItem: string): Promise<void> {
    const patch: { agencyName?: string; donationItem?: string } = {};
    const trimmedAgency = agencyName.trim();
    const trimmedItem = donationItem.trim();

    if (trimmedAgency) {
      patch.agencyName = trimmedAgency;
    }

    if (trimmedItem) {
      patch.donationItem = trimmedItem;
    }

    if (!patch.agencyName && !patch.donationItem) {
      return;
    }

    const { error } = await this.supabaseService.client.from(this.tableName).update(patch).eq('donationId', donationId);

    if (error) {
      throw error;
    }

    const apply = (item: PublicDonationThank): PublicDonationThank =>
      item.donationId === donationId ? { ...item, ...patch } : item;

    this.wallSignal.update((list) => list.map(apply));
    this.thanksSignal.update((list) => list.map(apply));
  }

  private async fetchWall(): Promise<PublicDonationThank[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('isPublic', true)
      .order('publishedAt', { ascending: false });

    if (error) {
      console.error('讀取感謝牆失敗：', error);
      throw error;
    }

    const thanks = (data ?? []).map((row) => this.mapRow(row as PublicDonationThankRow));
    this.wallSignal.set(thanks);

    return thanks;
  }

  private prependWall(thank: PublicDonationThank): void {
    this.wallSignal.update((list) => [thank, ...list.filter((item) => item.donationId !== thank.donationId)]);
  }

  private mapRow(row: PublicDonationThankRow): PublicDonationThank {
    return {
      id: Number(row.id),
      donorUid: row.donorUid,
      displayName: row.displayName ?? '',
      honorific: row.honorific ?? '',
      donationItem: row.donationItem ?? '',
      agencyName: row.agencyName ?? '',
      publishedAt: row.publishedAt ?? '',
      donationId: row.donationId ?? undefined,
    };
  }
}
