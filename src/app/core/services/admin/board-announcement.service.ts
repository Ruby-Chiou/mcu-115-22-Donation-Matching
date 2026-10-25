import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';

export type BoardName = 'thank_wall' | 'blacklist';

export interface BoardAnnouncement {
  id: number;
  board: BoardName;
  headline: string;
  body: string;
  published: boolean;
  sortOrder: number;
  donorUid: string | null;
}

interface BoardRow {
  id: number | string;
  board: string | null;
  headline: string | null;
  body: string | null;
  published: boolean | null;
  sort_order: number | null;
  donor_uid?: string | null;
}

const FALLBACK_BLACKLIST: BoardAnnouncement[] = [
  { id: -1, board: 'blacklist', headline: '吳○○', body: '冒名行為', published: true, sortOrder: 1, donorUid: null },
  { id: -2, board: 'blacklist', headline: '蔡○○', body: '未依約寄送', published: true, sortOrder: 2, donorUid: null },
  { id: -3, board: 'blacklist', headline: '林○○', body: '調換捐贈物品', published: true, sortOrder: 3, donorUid: null },
  { id: -4, board: 'blacklist', headline: '陳○○', body: '冒充官方單位', published: true, sortOrder: 4, donorUid: null },
];

@Injectable({
  providedIn: 'root',
})
export class BoardAnnouncementService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'board_announcements';

  async listAll(): Promise<BoardAnnouncement[]> {
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select('id, board, headline, body, published, sort_order, donor_uid')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as BoardRow[]).map((row) => this.mapRow(row));
  }

  async published(board: BoardName): Promise<BoardAnnouncement[]> {
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select('id, board, headline, body, published, sort_order, donor_uid')
      .eq('board', board)
      .eq('published', true)
      .order('sort_order', { ascending: false });

    if (error) {
      return board === 'blacklist' ? FALLBACK_BLACKLIST : [];
    }

    return ((data ?? []) as BoardRow[]).map((row) => this.mapRow(row));
  }

  async forDonor(donorUid: string): Promise<BoardAnnouncement[]> {
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select('id, board, headline, body, published, sort_order, donor_uid')
      .eq('donor_uid', donorUid)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data ?? []) as BoardRow[]).map((row) => this.mapRow(row));
  }

  async save(record: { id?: number; board: BoardName; headline: string; body: string; published: boolean; donorUid?: string | null }): Promise<void> {
    const payload = {
      board: record.board,
      headline: record.headline.trim(),
      body: record.body.trim(),
      published: record.published,
      donor_uid: record.donorUid ?? null,
      updated_at: new Date().toISOString(),
    };
    const query = record.id
      ? this.supabase.client.from(this.tableName).update(payload).eq('id', record.id)
      : this.supabase.client.from(this.tableName).insert({ ...payload, sort_order: Math.floor(Date.now() / 1000) });
    const { error } = await query;

    if (error) {
      throw error;
    }
  }

  async setPublished(id: number, published: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tableName)
      .update({ published, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.supabase.client.from(this.tableName).delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  private mapRow(row: BoardRow): BoardAnnouncement {
    return {
      id: Number(row.id),
      board: row.board === 'blacklist' ? 'blacklist' : 'thank_wall',
      headline: row.headline ?? '',
      body: row.body ?? '',
      published: row.published === true,
      sortOrder: row.sort_order ?? 0,
      donorUid: row.donor_uid ?? null,
    };
  }
}
