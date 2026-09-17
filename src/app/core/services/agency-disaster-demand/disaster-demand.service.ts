import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  from,
} from 'rxjs';

import {
  DisasterDemand,
  CreateDisasterDemand,
} from '../../../models/agency/disaster-demand';

import { SupabaseService } from '../supabase.service';

interface DisasterDemandRow {
  id: number | string;
  serialNo: number | string;
  created_at: string | null;
  publishedAt: string | null;
  expectedOffShelfAt: string | null;
  item: string | null;
  amount: number | string | null;
  remaining: number | string | null;
  unit: string | null;
  amountDescription: string | null;
  category: string | null;
  reason: string | null;
  description: string | null;
  brand: string | null;
  image: unknown;
  imageFileNames: unknown;
  conditionDescription: unknown;
  priority: string | null;
  status: string | null;
  address: string | null;
  phone: string | null;
  contactTimeDifferent: boolean | null;
  contactTimeMorning: boolean | null;
  contactTimeAfternoon: boolean | null;
  contactTimeEvening: boolean | null;
  weekdayMorning: boolean | null;
  weekdayAfternoon: boolean | null;
  weekdayEvening: boolean | null;
  weekendMorning: boolean | null;
  weekendAfternoon: boolean | null;
  weekendEvening: boolean | null;
  note: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DisasterDemandService {
  private readonly tableName =
    'agency_disaster_supply_items';

  private demands: DisasterDemand[] = [];

  private loadingPromise: Promise<void>;

  private readonly demandChangedSubject =
    new Subject<void>();

  readonly demandChanged$ =
    this.demandChangedSubject.asObservable();

  constructor(
    private readonly supabaseService: SupabaseService
  ) {
    this.loadingPromise =
      this.loadFromSupabase();
  }

  private async loadFromSupabase(): Promise<void> {
    const { data, error } =
      await this.supabaseService.client
        .from(this.tableName)
        .select('*')
        .order('serialNo', {
          ascending: true,
        })
        .abortSignal(
          AbortSignal.timeout(10000)
        );

    if (error) {
      console.error(
        '讀取災害物資需求失敗：',
        error
      );
      throw error;
    }

    this.demands = (data ?? []).map((row) =>
      this.mapRowToDemand(
        row as DisasterDemandRow
      )
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.loadingPromise;
  }

  async reload(): Promise<void> {
    this.loadingPromise =
      this.loadFromSupabase();

    await this.loadingPromise;
  }

  private mapRowToDemand(
    row: DisasterDemandRow
  ): DisasterDemand {
    return {
      serialNo: Number(row.serialNo),
      createdAt: row.created_at ?? '',
      publishedAt: row.publishedAt ?? undefined,
      expectedOffShelfAt:
        row.expectedOffShelfAt ?? undefined,
      item: row.item ?? '',
      amount: Number(row.amount ?? 0),
      remaining:
        row.remaining === null
          ? undefined
          : Number(row.remaining),
      unit: row.unit ?? '',
      amountDescription:
        row.amountDescription ?? '',
      category: (row.category ?? '') as DisasterDemand['category'],
      reason: row.reason ?? '',
      description: row.description ?? '',
      brand: row.brand ?? '',
      image: this.toStringArray(row.image),
      imageFileNames: this.toStringArray(
        row.imageFileNames
      ),
      conditions: this.toConditions(
        row.conditionDescription
      ),
      customConditions: [],
      priority: row.priority as DisasterDemand['priority'],
      status: row.status as DisasterDemand['status'],
      address: row.address ?? '',
      phone: row.phone ?? '',
      contactTimeDifferent:
        row.contactTimeDifferent ?? false,
      contactTimeMorning:
        row.contactTimeMorning ?? false,
      contactTimeAfternoon:
        row.contactTimeAfternoon ?? false,
      contactTimeEvening:
        row.contactTimeEvening ?? false,
      weekdayMorning:
        row.weekdayMorning ?? false,
      weekdayAfternoon:
        row.weekdayAfternoon ?? false,
      weekdayEvening:
        row.weekdayEvening ?? false,
      weekendMorning:
        row.weekendMorning ?? false,
      weekendAfternoon:
        row.weekendAfternoon ?? false,
      weekendEvening:
        row.weekendEvening ?? false,
      note: row.note ?? '',
    };
  }

  private demandToRow(
    demand: DisasterDemand
  ): Omit<DisasterDemandRow, 'id'> {
    return {
      serialNo: demand.serialNo,
      created_at: demand.createdAt || null,
      publishedAt: demand.publishedAt ?? null,
      expectedOffShelfAt:
        demand.expectedOffShelfAt ?? null,
      item: demand.item,
      amount: demand.amount,
      remaining: demand.remaining ?? null,
      unit: demand.unit,
      amountDescription:
        demand.amountDescription ?? null,
      category: demand.category,
      reason: demand.reason,
      description: demand.description,
      brand: demand.brand ?? null,
      image: demand.image ?? [],
      imageFileNames: demand.imageFileNames ?? [],
      conditionDescription:
        demand.conditions ?? {},
      priority: demand.priority,
      status: demand.status,
      address: demand.address,
      phone: demand.phone,
      contactTimeDifferent:
        demand.contactTimeDifferent ?? false,
      contactTimeMorning:
        demand.contactTimeMorning ?? false,
      contactTimeAfternoon:
        demand.contactTimeAfternoon ?? false,
      contactTimeEvening:
        demand.contactTimeEvening ?? false,
      weekdayMorning:
        demand.weekdayMorning ?? false,
      weekdayAfternoon:
        demand.weekdayAfternoon ?? false,
      weekdayEvening:
        demand.weekdayEvening ?? false,
      weekendMorning:
        demand.weekendMorning ?? false,
      weekendAfternoon:
        demand.weekendAfternoon ?? false,
      weekendEvening:
        demand.weekendEvening ?? false,
      note: demand.note ?? '',
    };
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === 'string'
      );
    }

    return [];
  }

  private toConditions(
    value: unknown
  ): DisasterDemand['conditions'] {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value as DisasterDemand['conditions'];
    }

    return {
      全新: '不接受',
      二手: '不接受',
      有擦痕: '不接受',
      過期: '不接受',
      毀損: '不接受',
    };
  }

  async addDemand(
    demand: CreateDisasterDemand
  ): Promise<void> {
    await this.reload();

    const newDemand = {
      ...demand,
      serialNo: this.getNextSerialNo(),
    } as DisasterDemand;

    const row = this.demandToRow(newDemand);

    const { data, error } =
      await this.supabaseService.client
        .from(this.tableName)
        .insert(row)
        .select('*')
        .single();

    if (error) {
      console.error(
        '新增災害物資需求失敗：',
        error
      );
      throw error;
    }

    const savedDemand =
      this.mapRowToDemand(
        data as DisasterDemandRow
      );

    this.demands = [
      ...this.demands,
      savedDemand,
    ];

    this.demandChangedSubject.next();
  }

  getDemands(): DisasterDemand[] {
    return [...this.demands];
  }

  getDemandsFromServer(): Observable<DisasterDemand[]> {
    return from(
      this.reload().then(
        () => [...this.demands]
      )
    );
  }

  getDemandBySerialNo(
    serialNo: number
  ): DisasterDemand | undefined {
    return this.demands.find(
      (demand) =>
        demand.serialNo === serialNo
    );
  }

  async updateDemand(
    updatedDemand: DisasterDemand
  ): Promise<void> {
    const row = this.demandToRow(updatedDemand);

    const { data, error } =
      await this.supabaseService.client
        .from(this.tableName)
        .update(row)
        .eq('serialNo', updatedDemand.serialNo)
        .select('*')
        .single();

    if (error) {
      console.error(
        '修改災害物資需求失敗：',
        error
      );
      throw error;
    }

    const savedDemand =
      this.mapRowToDemand(
        data as DisasterDemandRow
      );

    this.demands = this.demands.map(
      (item) =>
        item.serialNo === savedDemand.serialNo
          ? savedDemand
          : item
    );

    this.demandChangedSubject.next();
  }

 async deleteDemand(
  serialNo: number
): Promise<void> {
  const { data, error } =
    await this.supabaseService.client
      .from(this.tableName)
      .delete()
      .eq('serialNo', serialNo)
      .select('serialNo');

  if (error) {
    console.error(
      '刪除災害物資需求失敗：',
      error
    );

    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      `找不到要刪除的資料，serialNo：${serialNo}`
    );
  }

  this.demands = this.demands.filter(
    (item) =>
      item.serialNo !== serialNo
  );

  this.demandChangedSubject.next();
}

private getNextSerialNo(): number {
  if (this.demands.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...this.demands.map(
        (item) => item.serialNo
      )
    ) + 1
  );
}

}
