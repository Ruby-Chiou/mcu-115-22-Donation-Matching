import { Injectable, inject } from '@angular/core';

import { PlatformAnnouncement } from '../../content/platform-feed';
import { SupabaseService } from '../database/supabase.service';

export interface PlatformAnnouncementRecord {
  id: number;
  body: string;
  published: boolean;
  publishedAt: string;
}

interface AnnouncementRow {
  id: number | string;
  body: string | null;
  published: boolean | null;
  published_at: string | null;
  created_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PlatformAnnouncementService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'platform_announcements';

  async listAll(): Promise<PlatformAnnouncementRecord[]> {
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select('id, body, published, published_at, created_at')
      .order('published_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as AnnouncementRow[]).map((row) => this.mapRow(row));
  }

  async published(): Promise<PlatformAnnouncement[]> {
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select('id, body, published, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as AnnouncementRow[]).map((row) => ({
      date: this.displayDate(row.published_at ?? row.created_at),
      text: row.body?.trim() || '',
    }));
  }

  async save(record: { id?: number; body: string; published: boolean }): Promise<void> {
    const now = new Date().toISOString();
    const payload = {
      body: record.body.trim(),
      published: record.published,
      published_at: record.published ? now : null,
      updated_at: now,
    };

    const query = record.id
      ? this.supabase.client.from(this.tableName).update(payload).eq('id', record.id)
      : this.supabase.client.from(this.tableName).insert(payload);
    const { error } = await query;

    if (error) {
      throw error;
    }
  }

  async setPublished(record: PlatformAnnouncementRecord, published: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tableName)
      .update({
        published,
        published_at: published ? record.publishedAt || new Date().toISOString() : record.publishedAt || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

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

  private mapRow(row: AnnouncementRow): PlatformAnnouncementRecord {
    return {
      id: Number(row.id),
      body: row.body ?? '',
      published: row.published === true,
      publishedAt: row.published_at ?? '',
    };
  }

  private displayDate(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}
