import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

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

  /**
   * 從 Supabase 讀取所有資料
   */
  private async loadFromSupabase(): Promise<void> {
    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').order('id', {
      ascending: true,
    });

    if (error) {
      console.error('讀取志工需求失敗：', error);

      return;
    }

    this.demands = (data ?? []).map((row) => this.mapRowToDemand(row as VolunteerDemandRow));
  }

  /**
   * 等待第一次資料載入完成
   */
  async waitUntilLoaded(): Promise<void> {
    await this.loadingPromise;
  }

  /**
   * 重新讀取 Supabase 資料
   */
  async reload(): Promise<void> {
    this.loadingPromise = this.loadFromSupabase();

    await this.loadingPromise;
  }

  /**
   * 將資料庫資料轉成前端資料格式
   */
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

  /**
   * 將前端資料轉成資料庫資料
   */
  private demandToRow(demand: VolunteerDemand): Omit<VolunteerDemandRow, 'id'> {
    return {
      serialNo: demand.serialNo,
      type: demand.type,
      people: demand.people,
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

  /**
   * 取得全部需求
   */
  getDemands(): VolunteerDemand[] {
    return [...this.demands];
  }

  /**
   * 給志工卡片列表使用
   */
  getVolunteers(): VolunteerDemand[] {
    return this.demands.filter((demand) => demand.status === '上架');
  }

  async getVolunteerByDatabaseId(id: number): Promise<VolunteerDemand | undefined> {
    console.log('[志工詳細頁] 準備查詢資料庫 id：', id);

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('id', id).maybeSingle();

    console.log('[志工詳細頁] Supabase data：', data);

    console.log('[志工詳細頁] Supabase error：', error);

    if (error) {
      console.error('讀取單筆志工需求失敗：', error);

      throw error;
    }

    if (!data) {
      return undefined;
    }

    return this.mapRowToDemand(data as VolunteerDemandRow);
  }

  /**
   * 取得單筆需求
   */
  getDemandById(id: number): VolunteerDemand | undefined {
    return this.demands.find((demand) => demand.serialNo === id);
  }

  /**
   * 給志工詳細頁使用
   */
  getVolunteerById(id: number): VolunteerDemand | undefined {
    return this.getDemandById(id);
  }

  /**
   * 新增需求
   */
  async addDemand(demand: VolunteerDemand): Promise<void> {
    const row = this.demandToRow(demand);

    const { data, error } = await this.supabaseService.client.from(this.tableName).insert(row).select('*').single();

    if (error) {
      console.error('新增志工需求失敗：', error);

      throw error;
    }

    const newDemand = this.mapRowToDemand(data as VolunteerDemandRow);

    this.demands.push(newDemand);
    this.demandChangedSubject.next();
  }

  /**
   * 修改單筆需求
   */
  async updateDemand(updatedDemand: VolunteerDemand): Promise<void> {
    const row = this.demandToRow(updatedDemand);

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(row)
      .eq('id', updatedDemand.serialNo)
      .select('*')
      .single();

    if (error) {
      console.error('修改志工需求失敗：', error);

      throw error;
    }

    const savedDemand = this.mapRowToDemand(data as VolunteerDemandRow);

    const index = this.demands.findIndex((item) => item.serialNo === updatedDemand.serialNo);

    if (index !== -1) {
      this.demands[index] = savedDemand;
    }

    this.demandChangedSubject.next();
  }

  /**
   * 刪除需求
   */
  async deleteDemand(id: number): Promise<void> {
    const { error } = await this.supabaseService.client.from(this.tableName).delete().eq('id', id);

    if (error) {
      console.error('刪除志工需求失敗：', error);

      throw error;
    }

    this.demands = this.demands.filter((item) => item.serialNo !== id);
    this.demandChangedSubject.next();
  }

  /**
   * 批次修改需求
   */
  async updateBatchDemands(updatedDemands: VolunteerDemand[]): Promise<void> {
    for (const demand of updatedDemands) {
      await this.updateDemand(demand);
    }
  }

  /**
   * 儲存選取的需求
   */
  setSelectedDemands(demands: VolunteerDemand[]): void {
    this.selectedDemands = structuredClone(demands);
  }

  /**
   * 取得選取的需求
   */
  getSelectedDemands(): VolunteerDemand[] {
    return structuredClone(this.selectedDemands);
  }
}
