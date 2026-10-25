import { Injectable, inject } from '@angular/core';

import { maskDonorName } from '../../../models/member/public-donation-thank';
import { SupabaseService } from '../database/supabase.service';
import { BoardAnnouncement, BoardAnnouncementService, BoardName } from './board-announcement.service';
import { DonorAccountRecord } from './donor-account-admin.service';

@Injectable({
  providedIn: 'root',
})
export class DonorBoardService {
  private readonly supabase = inject(SupabaseService);
  private readonly boards = inject(BoardAnnouncementService);

  maskName(donor: DonorAccountRecord): string {
    return maskDonorName(donor.displayName || donor.fullName || donor.email.split('@')[0] || '捐助者');
  }

  async boardMarks(): Promise<Map<string, { thank: boolean; blacklist: boolean }>> {
    const marks = new Map<string, { thank: boolean; blacklist: boolean }>();
    const [rows, thanks] = await Promise.all([
      this.boards.listAll(),
      this.supabase.client.from('public_donation_thanks').select('donorUid, donationId, isPublic').like('donationId', 'admin-wall:%'),
    ]);

    for (const row of rows) {
      if (!row.donorUid || !row.published || row.board !== 'blacklist') {
        continue;
      }

      const current = marks.get(row.donorUid) ?? { thank: false, blacklist: false };
      current.blacklist = true;
      marks.set(row.donorUid, current);
    }

    if (!thanks.error) {
      for (const row of thanks.data ?? []) {
        const donorUid = String(row.donorUid ?? '');
        if (!donorUid || row.isPublic !== true) {
          continue;
        }

        const current = marks.get(donorUid) ?? { thank: false, blacklist: false };
        current.thank = true;
        marks.set(donorUid, current);
      }
    }

    return marks;
  }

  async adminThank(donorUid: string): Promise<{ displayName: string; donationItem: string } | null> {
    const { data, error } = await this.supabase.client
      .from('public_donation_thanks')
      .select('displayName, donationItem, isPublic')
      .eq('donationId', `admin-wall:${donorUid}`)
      .maybeSingle();

    if (error || !data || data.isPublic !== true) {
      return null;
    }

    return {
      displayName: String(data.displayName ?? ''),
      donationItem: String(data.donationItem ?? ''),
    };
  }

  async boardEntry(donorUid: string, board: BoardName): Promise<BoardAnnouncement | null> {
    const rows = await this.boards.forDonor(donorUid);
    return rows.find((row) => row.board === board) ?? null;
  }

  async publicDonorBlacklist(): Promise<BoardAnnouncement[]> {
    const rows = await this.boards.published('blacklist');
    return rows.filter((row) => row.donorUid);
  }

  async saveBoard(donor: DonorAccountRecord, board: BoardName, headline: string, body: string): Promise<void> {
    const existing = await this.boardEntry(donor.uid, board);
    await this.boards.save({
      id: existing?.id,
      board,
      headline,
      body,
      published: true,
      donorUid: donor.uid,
    });

    if (board === 'thank_wall') {
      await this.publishThankCard(donor, headline, body);
    }
  }

  async publishThankCard(donor: DonorAccountRecord, displayName: string, donationItem: string): Promise<void> {
    const donationId = `admin-wall:${donor.uid}`;
    const payload = {
      donorUid: donor.uid,
      displayName: displayName.trim(),
      honorific: '',
      donationItem: donationItem.trim(),
      agencyName: '平台',
      isPublic: true,
      donationId,
      publishedAt: new Date().toISOString(),
    };
    const { data, error } = await this.supabase.client.from('public_donation_thanks').select('id').eq('donationId', donationId).maybeSingle();

    if (error) {
      throw error;
    }

    const query = data
      ? this.supabase.client.from('public_donation_thanks').update(payload).eq('donationId', donationId)
      : this.supabase.client.from('public_donation_thanks').insert(payload);
    const { error: writeError } = await query;

    if (writeError) {
      throw writeError;
    }
  }

  async clearBoard(donorUid: string, board: BoardName): Promise<void> {
    const existing = await this.boardEntry(donorUid, board);
    if (existing) {
      await this.boards.remove(existing.id);
    }

    if (board === 'thank_wall') {
      const { error } = await this.supabase.client
        .from('public_donation_thanks')
        .update({ isPublic: false })
        .eq('donationId', `admin-wall:${donorUid}`);

      if (error) {
        throw error;
      }
    }
  }
}
