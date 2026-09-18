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
      // 資料庫主鍵：所有 CRUD、詳細頁路由都使用它
      id: Number(row.id),

      // 流水號：僅供畫面顯示
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
      // 不傳 id，讓資料庫 insert 時自動產生主鍵
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
   * 從目前前端記憶體陣列依資料庫主鍵 id 查詢。
   * 適合列表已經載入時使用；重整詳細頁時請用 getVolunteerByDatabaseId。
   */
  getDemandById(id: number): VolunteerDemand | undefined {
    return this.demands.find((demand) => demand.id === id);
  }

  /**
   * 舊名稱保留，避免其他元件立刻編譯失敗。
   * 現在同樣改成以資料庫 id 查詢。
   */
  getVolunteerById(id: number): VolunteerDemand | undefined {
    return this.getDemandById(id);
  }

  /**
   * 直接從 Supabase 依資料庫主鍵 id 查詢。
   * 詳細頁／編輯頁在手動重整後應使用此方法。
   */
  async getVolunteerByDatabaseId(id: number): Promise<VolunteerDemand | undefined> {
    console.log('[志工需求] 查詢資料庫 id：', id);

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('id', id).maybeSingle();

    console.log('[志工需求] Supabase data：', data);

    console.log('[志工需求] Supabase error：', error);

    if (error) {
      console.error('讀取單筆志工需求失敗：', error);

      throw error;
    }

    if (!data) {
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

  async addDemand(demand: VolunteerDemand): Promise<void> {
    const row = this.demandToRow(demand);

    const { data, error } = await this.supabaseService.client.from(this.tableName).insert(row).select('*').single();

    if (error) {
      console.error('新增志工需求失敗：', error);

      throw error;
    }

    const newDemand = this.mapRowToDemand(data as VolunteerDemandRow);

    this.demands = [...this.demands, newDemand];

    this.demandChangedSubject.next();
  }

  async updateDemand(updatedDemand: VolunteerDemand): Promise<void> {
    if (updatedDemand.id == null || !Number.isFinite(updatedDemand.id)) {
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
