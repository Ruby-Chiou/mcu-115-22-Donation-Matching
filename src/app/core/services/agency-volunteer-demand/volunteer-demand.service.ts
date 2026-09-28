import { Injectable } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';

import { VolunteerDemand } from '../../../models/agency/volunteer-demand';
import { SupabaseService } from '../supabase.service';

interface VolunteerDemandRow {
  id: number | string;

  serialNo: number | null;
  type: string | null;
  people: number | null;

  location: string | null;
  condition: string | null;
  workContent: string | null;
  reason: string | null;

  priority: string | null;
  status: string | null;

  contact: string | null;
  phone: string | null;
  note: string | null;

  messageCount: number | null;

  createdAt: string | null;
  publishedAt: string | null;
  offShelfAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class VolunteerDemandService {
  private readonly tableName = 'agency_disaster_volunteer_items';

  private demands: VolunteerDemand[] = [];

  private selectedDemands: VolunteerDemand[] = [];

  private loadingPromise: Promise<void>;

  private readonly demandChangedSubject = new Subject<void>();

  readonly demandChanged$ = this.demandChangedSubject.asObservable();

  constructor(private readonly supabaseService: SupabaseService) {
    this.loadingPromise = this.loadFromSupabase();
  }

  private async loadFromSupabase(): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .order('serialNo', {
        ascending: true,
      })
      .abortSignal(AbortSignal.timeout(10000));

    if (error) {
      console.error('讀取志工需求失敗：', error);

      throw error;
    }

    this.demands = (data ?? []).map((row) => this.mapRowToDemand(row as VolunteerDemandRow));
  }

  async waitUntilLoaded(): Promise<void> {
    await this.loadingPromise;
  }

  async reload(): Promise<void> {
    this.loadingPromise = this.loadFromSupabase();

    await this.loadingPromise;
  }

  private mapRowToDemand(row: VolunteerDemandRow): VolunteerDemand {
    return {
      id: Number(row.id),

      serialNo: Number(row.serialNo ?? 0),

      type: row.type ?? '',
      people: row.people ?? 0,

      location: row.location ?? '',
      condition: row.condition ?? '',
      workContent: row.workContent ?? '',
      reason: row.reason ?? '',

      priority: row.priority as VolunteerDemand['priority'],

      status: row.status as VolunteerDemand['status'],

      contact: row.contact ?? '',
      phone: row.phone ?? '',
      note: row.note ?? '',

      messageCount: row.messageCount ?? 0,

      createdAt: row.createdAt ?? '',

      publishedAt: row.publishedAt ?? '',

      expectedOffShelfAt: row.offShelfAt ?? '',
    };
  }

  private demandToRow(demand: VolunteerDemand): Omit<VolunteerDemandRow, 'id'> {
    return {
      serialNo: demand.serialNo,

      type: demand.type,
      people: demand.people ?? null,

      location: demand.location,
      condition: demand.condition,
      workContent: demand.workContent,
      reason: demand.reason,

      priority: demand.priority,
      status: demand.status,

      contact: demand.contact,
      phone: demand.phone,
      note: demand.note ?? null,

      messageCount: demand.messageCount ?? null,

      createdAt: demand.createdAt || null,

      publishedAt: demand.publishedAt || null,

      offShelfAt: demand.expectedOffShelfAt || null,
    };
  }

  getDemands(): VolunteerDemand[] {
    return [...this.demands];
  }

  getVolunteers(): VolunteerDemand[] {
    return this.demands.filter((demand) => demand.status === '上架');
  }

  getDemandsFromServer(): Observable<VolunteerDemand[]> {
    return from(this.reload().then(() => [...this.demands]));
  }

  /**
   * 依資料庫主鍵 id 直接向 Supabase 取得單筆志工需求。
   * 詳細頁、編輯頁與頁面重整都應呼叫此方法。
   */
  async getDemandById(id: number): Promise<VolunteerDemand | undefined> {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[志工需求] 無效的資料庫 id：', id);

      return undefined;
    }

    console.log('[志工需求] 以資料庫 id 查詢：', id);

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('id', id).maybeSingle();

    console.log('[志工需求] Supabase 查詢結果：', {
      id,
      data,
      error,
    });

    if (error) {
      console.error('讀取單筆志工需求失敗：', error);

      throw error;
    }

    if (!data) {
      console.warn('[志工需求] 找不到資料庫資料，id：', id);

      return undefined;
    }

    const demand = this.mapRowToDemand(data as VolunteerDemandRow);

    const index = this.demands.findIndex((item) => item.id === demand.id);

    if (index === -1) {
      this.demands = [...this.demands, demand];
    } else {
      this.demands = this.demands.map((item) => (item.id === demand.id ? demand : item));
    }

    return demand;
  }

  /**
   * 保留舊方法名稱，讓舊元件仍可使用；
   * 現在也改為以資料庫 id 向 Supabase 查詢。
   */
  async getVolunteerById(id: number): Promise<VolunteerDemand | undefined> {
    return this.getDemandById(id);
  }

  /**
   * 保留舊方法名稱，讓現有詳細頁程式可直接使用。
   */
  async getVolunteerByDatabaseId(id: number): Promise<VolunteerDemand | undefined> {
    return this.getDemandById(id);
  }

  async addDemand(demand: VolunteerDemand): Promise<VolunteerDemand> {
    const row = this.demandToRow(demand);

    const { data, error } = await this.supabaseService.client.from(this.tableName).insert(row).select('*').single();

    if (error) {
      console.error('新增志工需求失敗：', error);

      throw error;
    }

    const newDemand = this.mapRowToDemand(data as VolunteerDemandRow);

    this.demands = [...this.demands, newDemand];

    this.demandChangedSubject.next();

    return newDemand;
  }

  async updateDemand(updatedDemand: VolunteerDemand): Promise<VolunteerDemand> {
    if (updatedDemand.id == null || !Number.isInteger(Number(updatedDemand.id)) || Number(updatedDemand.id) <= 0) {
      throw new Error(`找不到資料庫 id，無法修改志工需求。serialNo：${updatedDemand.serialNo}`);
    }

    const row = this.demandToRow(updatedDemand);

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(row)
      .eq('id', updatedDemand.id)
      .select('*')
      .single();

    if (error) {
      console.error('修改志工需求失敗：', error);

      throw error;
    }

    if (!data) {
      throw new Error(`找不到更新後的志工需求，id：${updatedDemand.id}`);
    }

    const savedDemand = this.mapRowToDemand(data as VolunteerDemandRow);

    this.demands = this.demands.map((item) => (item.id === savedDemand.id ? savedDemand : item));

    this.demandChangedSubject.next();

    return savedDemand;
  }

  async deleteDemand(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`無效的志工需求資料庫 id：${id}`);
    }

    const { data, error } = await this.supabaseService.client.from(this.tableName).delete().eq('id', id).select('id');

    if (error) {
      console.error('刪除志工需求失敗：', error);

      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`找不到或沒有權限刪除志工需求，id：${id}`);
    }

    this.demands = this.demands.filter((item) => item.id !== id);

    this.demandChangedSubject.next();
  }

  async updateBatchDemands(updatedDemands: VolunteerDemand[]): Promise<void> {
    for (const demand of updatedDemands) {
      await this.updateDemand(demand);
    }
  }

  setSelectedDemands(demands: VolunteerDemand[]): void {
    this.selectedDemands = structuredClone(demands);
  }

  getSelectedDemands(): VolunteerDemand[] {
    return structuredClone(this.selectedDemands);
  }
}
