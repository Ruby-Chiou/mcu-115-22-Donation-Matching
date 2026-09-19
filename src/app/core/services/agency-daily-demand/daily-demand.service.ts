import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

import { DailyDemand, CreateDailyDemand, DailyConditions } from '../../../models/agency/daily-demand';

import { SupabaseService } from '../supabase.service';

interface DailyDemandRow {
  id: number;

  createdAt: string;
  publishedAt: string | null;
  expectedOffShelfAt: string | null;

  item: string;
  amount: number;
  remaining: number | null;
  unit: string;
  amountDescription: string | null;

  category: string;
  reason: string;
  description: string;
  brand: string | null;

  serviceTargets: string[] | null;
  customServiceTargets: unknown[] | null;
  conditions: string[] | null;
  customConditions: unknown[] | null;

  priority: string;
  status: string;

  receiveMethod: string[];
  recipient: string;
  address: string;
  phone: string;
  note: string | null;

  imageFileNames: unknown;
  serialNo: number | null;
  image: unknown;

  contactTimeWeekday: boolean;
  contactTimeWeekend: boolean | null;
  contactTimeMorning: boolean | null;
  contactTimeAfternoon: boolean | null;
  contactTimeEvening: boolean | null;
}

@Injectable({
  providedIn: 'root',
})
export class DailyDemandService {
  private readonly tableName = 'agency_daily_supply_items';

  private demands: DailyDemand[] = [];

  private loadingPromise: Promise<void>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.loadingPromise = this.loadFromSupabase();
  }

  private async loadFromSupabase(): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .order('id', {
        ascending: true,
      })
      .abortSignal(AbortSignal.timeout(10000));

    if (error) {
      console.error('讀取日常物資需求失敗：', error);

      throw error;
    }

    this.demands = (data ?? []).map((row) => this.mapRowToDemand(row as DailyDemandRow));
  }

  async waitUntilLoaded(): Promise<void> {
    await this.loadingPromise;
  }

  async reload(): Promise<void> {
    this.loadingPromise = this.loadFromSupabase();

    await this.loadingPromise;
  }

  private mapRowToDemand(row: DailyDemandRow): DailyDemand {
    return {
      id: row.id,
      serialNo: this.toSerialNo(row.serialNo, row.id),

      item: row.item,
      amount: Number(row.amount ?? 0),
      unit: row.unit,
      amountDescription: row.amountDescription ?? '',

      reason: row.reason,
      description: row.description,
      priority: row.priority as DailyDemand['priority'],
      category: row.category as DailyDemand['category'],

      receiveMethod: {
        寄送: row.receiveMethod?.includes('寄送') ?? false,

        面交: row.receiveMethod?.includes('面交') ?? false,
      },

      recipient: row.recipient,
      address: row.address,
      phone: row.phone,
      note: row.note ?? '',
      brand: row.brand ?? '',

      serviceTargets: row.serviceTargets ?? [],

      customServiceTargets: this.toStringArray(row.customServiceTargets),

      serviceTargetDescription: [...(row.serviceTargets ?? []), ...this.toStringArray(row.customServiceTargets)].join('、'),

      conditions: this.toConditions(row.conditions),

      customConditions: this.toStringArray(row.customConditions),

      conditionDescription: this.createConditionDescription(row.conditions, row.customConditions),

      status: row.status as DailyDemand['status'],

      remaining: row.remaining === null ? undefined : Number(row.remaining),

      messageCount: 0,

      createdAt: row.createdAt,
      publishedAt: row.publishedAt ?? undefined,

      expectedOffShelfAt: row.expectedOffShelfAt ?? undefined,

      image: this.toStringArray(row.image),
      imageFileNames: this.toStringArray(row.imageFileNames),

      contactTimeWeekday: row.contactTimeWeekday ?? false,

      contactTimeWeekend: row.contactTimeWeekend ?? false,

      contactTimeMorning: row.contactTimeMorning ?? false,

      contactTimeAfternoon: row.contactTimeAfternoon ?? false,

      contactTimeEvening: row.contactTimeEvening ?? false,

      contactTimeSeparate: false,

      contactTimeWeekdayMorning: false,
      contactTimeWeekdayAfternoon: false,
      contactTimeWeekdayEvening: false,

      contactTimeWeekendMorning: false,
      contactTimeWeekendAfternoon: false,
      contactTimeWeekendEvening: false,
    };
  }

  private toSerialNo(serialNo: number | string | null, id: number): number {
    const parsedSerialNo = Number(serialNo);

    if (serialNo !== null && serialNo !== '' && Number.isFinite(parsedSerialNo)) {
      return parsedSerialNo;
    }

    return id;
  }
  private demandToRow(demand: DailyDemand): Record<string, unknown> {
    return {
      createdAt: demand.createdAt || undefined,

      publishedAt: demand.publishedAt ?? null,

      expectedOffShelfAt: demand.expectedOffShelfAt ?? null,

      item: demand.item,
      amount: demand.amount,
      remaining: demand.remaining ?? 0,
      unit: demand.unit,

      amountDescription: demand.amountDescription ?? null,

      category: demand.category,
      reason: demand.reason,
      description: demand.description,

      brand: demand.brand ?? '無',

      serviceTargets: demand.serviceTargets ?? [],

      customServiceTargets: demand.customServiceTargets ?? [],

      conditions: this.conditionsToArray(demand.conditions),

      customConditions: demand.customConditions ?? [],

      priority: demand.priority,
      status: demand.status,

      receiveMethod: this.receiveMethodToArray(demand.receiveMethod),

      recipient: demand.recipient,
      address: demand.address,
      phone: demand.phone,
      note: demand.note ?? null,

      imageFileNames: demand.imageFileNames ?? [],

      serialNo: demand.serialNo,

      image: demand.image ?? [],

      contactTimeWeekday: demand.contactTimeWeekday ?? false,

      contactTimeWeekend: demand.contactTimeWeekend ?? false,

      contactTimeMorning: demand.contactTimeMorning ?? false,

      contactTimeAfternoon: demand.contactTimeAfternoon ?? false,

      contactTimeEvening: demand.contactTimeEvening ?? false,
    };
  }

  async addDemand(demand: CreateDailyDemand): Promise<void> {
    await this.reload();

    const serialNo = this.getNextSerialNo();

    const newDemand = {
      ...demand,
      serialNo,
    } as DailyDemand;

    const row = this.demandToRow(newDemand);

    const { data, error } = await this.supabaseService.client.from(this.tableName).insert(row).select('*').single();

    if (error) {
      console.error('新增日常物資需求失敗：', error);

      throw error;
    }

    const savedDemand = this.mapRowToDemand(data as DailyDemandRow);

    this.demands = [...this.demands, savedDemand];
  }

  getDemands(): DailyDemand[] {
    return [...this.demands];
  }

  getDemandsFromServer(): Observable<DailyDemand[]> {
    return from(this.reload().then(() => [...this.demands]));
  }

  async getDemandById(id: number): Promise<DailyDemand | undefined> {
    console.log('[getDemandById] 準備查詢資料庫 id：', id);

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('id', id).maybeSingle();

    console.log('[getDemandById] Supabase data：', data);
    console.log('[getDemandById] Supabase error：', error);

    if (error) {
      console.error('讀取單筆日常物資需求失敗：', error);

      throw error;
    }

    if (!data) {
      console.warn(`查無日常物資需求：id=${id}`);

      return undefined;
    }

    return this.mapRowToDemand(data as DailyDemandRow);
  }

  async updateDemand(updatedDemand: DailyDemand): Promise<void> {
    if (updatedDemand.id == null) {
      throw new Error(`找不到資料庫 id，無法更新日常物資：serialNo=${updatedDemand.serialNo}`);
    }

    const row = this.demandToRow(updatedDemand);

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(row)
      .eq('id', updatedDemand.id)
      .select('*')
      .single();

    if (error) {
      console.error('修改日常物資需求失敗：', error);

      throw error;
    }

    if (!data) {
      throw new Error(`找不到更新後的日常物資資料：id=${updatedDemand.id}`);
    }

    const savedDemand = this.mapRowToDemand(data as DailyDemandRow);

    this.demands = this.demands.map((item) => (item.id === savedDemand.id ? savedDemand : item));
  }

  async updateDemandStatus(
    serialNo: number,
    status: DailyDemand['status'],
    publishedAt?: string,
    expectedOffShelfAt?: string
  ): Promise<DailyDemand> {
    const updateData = {
      status,
      publishedAt: publishedAt ?? null,
      expectedOffShelfAt: expectedOffShelfAt ?? null,
    };

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(updateData)
      .eq('serialNo', serialNo)
      .select('*')
      .single();

    if (error) {
      console.error('修改日常物資狀態失敗：', error);

      throw error;
    }

    if (!data) {
      throw new Error(`找不到要更新的日常物資，serialNo：${serialNo}`);
    }

    const savedDemand = this.mapRowToDemand(data as DailyDemandRow);

    this.demands = this.demands.map((item) => (item.serialNo === serialNo ? savedDemand : item));

    return savedDemand;
  }

  async deleteDemand(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`要刪除的日常物資需求 id 不正確：${id}`);
    }

    const { data, error } = await this.supabaseService.client.from(this.tableName).delete().eq('id', id).select('id');

    if (error) {
      console.error('刪除日常物資需求失敗：', error);

      throw error;
    }

    /*
     * PostgREST / Supabase delete().select()
     * 只有在資料真的被刪除時才會回傳資料。
     */
    if (!data || data.length === 0) {
      throw new Error(`找不到要刪除的日常物資需求，id：${id}`);
    }

    this.demands = this.demands.filter((item) => item.id !== id);

    console.log('[DailyDemandService] 日常物資需求已刪除：', {
      id,
    });
  }

  private getNextSerialNo(): number {
    if (this.demands.length === 0) {
      return 1;
    }

    return Math.max(...this.demands.map((item) => item.serialNo)) + 1;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return [];
  }

  private toConditions(value: string[] | null): DailyConditions {
    const conditions: DailyConditions = {
      全新: '不接受',
      二手: '不接受',
      有擦痕: '不接受',
      過期: '不接受',
      毀損: '不接受',
    };

    for (const condition of value ?? []) {
      const separatorIndex = condition.indexOf('：');

      if (separatorIndex === -1) {
        continue;
      }

      const name = condition.slice(0, separatorIndex) as keyof DailyConditions;

      const result = condition.slice(separatorIndex + 1) as DailyConditions[keyof DailyConditions];

      if (name in conditions) {
        conditions[name] = result;
      }
    }

    return conditions;
  }

  private conditionsToArray(conditions: DailyDemand['conditions']): string[] {
    return Object.entries(conditions ?? {}).map(([name, result]) => `${name}：${result}`);
  }

  private createConditionDescription(conditions: string[] | null, customConditions: unknown[] | null): string {
    return [...(conditions ?? []), ...this.toStringArray(customConditions)].join('、');
  }

  private receiveMethodToArray(receiveMethod: DailyDemand['receiveMethod']): string[] {
    const methods: string[] = [];

    if (receiveMethod?.寄送) {
      methods.push('寄送');
    }

    if (receiveMethod?.面交) {
      methods.push('面交');
    }

    return methods;
  }
}
