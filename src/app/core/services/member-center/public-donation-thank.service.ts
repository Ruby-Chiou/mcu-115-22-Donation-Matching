import { Injectable, inject, signal } from '@angular/core';

import { PublicDonationThank } from '../../../models/member/public-donation-thank';
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

  private mapRow(row: PublicDonationThankRow): PublicDonationThank {
    return {
      id: Number(row.id),
      donorUid: row.donorUid,
      displayName: row.displayName ?? '',
      honorific: row.honorific ?? '',
      donationItem: row.donationItem ?? '',
      agencyName: row.agencyName ?? '',
      publishedAt: row.publishedAt ?? '',
    };
  }
}
