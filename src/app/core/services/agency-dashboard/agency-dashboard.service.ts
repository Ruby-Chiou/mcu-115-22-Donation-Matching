import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../database/supabase.service';
import { AgencyReceiptIssuanceService } from '../agency/agency-receipt-issuance.service';

export interface AgencyDashboardSummary {
  dailyDemandCount: number | null;
  pendingItemReviewCount: number | null;
  pendingReceiptReviewCount: number | null;
  pendingReceivingCount: number | null;
  emergencyMaterialCount: number | null;
  emergencyVolunteerCount: number | null;
}

export interface UrgentDailyNeed {
  id: string;
  serialNo: number;
  item: string;
  requiredQuantity: number;
  receivedQuantity: number | null;
  unit: string;
}

export interface DashboardReminderItem {
  id: string;
  name: string;
  deadline: string | null;
  remaining: number | null;
  unit: string;
}

export interface DashboardReminderGroup {
  key: 'daily-expiring' | 'daily-completed' | 'disaster-expiring' | 'volunteer-expiring';
  label: string;
  title: string;
  type: 'normal' | 'emergency';
  items: DashboardReminderItem[];
}

@Injectable({
  providedIn: 'root',
})
export class AgencyDashboardService {
  private readonly receiptIssuanceService = inject(AgencyReceiptIssuanceService);

  constructor(private readonly supabaseService: SupabaseService) {}

  // 非常緊急日常需求
  async getUrgentDailyNeeds(): Promise<UrgentDailyNeed[]> {
    const { data, error } = await this.supabaseService.client
      .from('agency_daily_supply_items')
      .select('id, serialNo, item, amount, remaining, unit')
      .eq('status', '上架')
      .eq('priority', '非常緊急')
      .order('publishedAt', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      serialNo: Number(row.serialNo ?? row.id),
      item: row.item,
      requiredQuantity: row.amount,
      receivedQuantity: row.remaining === null ? null : Math.max(0, row.amount - row.remaining),
      unit: row.unit,
    }));
  }

  // 五張卡片統計
  async getSummary(): Promise<AgencyDashboardSummary> {
    const [
      dailyDemandResult,
      pendingItemReviewResult,
      pendingReceiptReviewResult,
      emergencyMaterialResult,
      emergencyVolunteerResult,
    ] = await Promise.all([
      this.getPublishedDailyDemandCount(),
      this.getPendingItemReviewCount(),
      this.receiptIssuanceService.countPending().catch(() => null),
      this.getPublishedEmergencyMaterialCount(),
      this.getPublishedEmergencyVolunteerCount(),
    ]);

    return {
      dailyDemandCount: dailyDemandResult,
      pendingItemReviewCount: pendingItemReviewResult,
      pendingReceiptReviewCount: pendingReceiptReviewResult,
      pendingReceivingCount: null,
      emergencyMaterialCount: emergencyMaterialResult,
      emergencyVolunteerCount: emergencyVolunteerResult,
    };
  }

  // 待辦提醒：查詢現在起未來 72 小時內的截止項目
  async getReminders(): Promise<DashboardReminderGroup[]> {
    const now = new Date();
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const start = now.toISOString();
    const end = deadline.toISOString();
    const client = this.supabaseService.client;

    const [dailyExpiring, dailyCompleted, disasterExpiring, volunteerExpiring] = await Promise.all([
      // 日常：即將下架，仍未募足
      client
        .from('agency_daily_supply_items')
        .select('id, item, expectedOffShelfAt, remaining, unit')
        .eq('status', '上架')
        .gt('remaining', 0)
        .gte('expectedOffShelfAt', start)
        .lte('expectedOffShelfAt', end)
        .order('expectedOffShelfAt', { ascending: true }),

      // 日常：剩餘需求歸零，仍上架
      client
        .from('agency_daily_supply_items')
        .select('id, item, remaining, unit')
        .eq('status', '上架')
        .eq('remaining', 0)
        .order('item', { ascending: true }),

      // 急難物資：募集即將截止
      client
        .from('agency_disaster_supply_items')
        .select('id, item, expectedOffShelfAt')
        .eq('status', '上架')
        .gte('expectedOffShelfAt', start)
        .lte('expectedOffShelfAt', end)
        .order('expectedOffShelfAt', { ascending: true }),

      // 急難志工：依下架時間提醒
      client
        .from('agency_disaster_volunteer_items')
        .select('id, type, workContent, offShelfAt')
        .eq('status', '上架')
        .gte('offShelfAt', start)
        .lte('offShelfAt', end)
        .order('offShelfAt', { ascending: true }),
    ]);

    for (const result of [dailyExpiring, dailyCompleted, disasterExpiring, volunteerExpiring]) {
      if (result.error) {
        throw result.error;
      }
    }

    const groups: DashboardReminderGroup[] = [
      {
        key: 'daily-expiring',
        label: '日常',
        title: '即將下架，仍未募足',
        type: 'normal',
        items: (dailyExpiring.data ?? []).map((row) => ({
          id: String(row.id),
          name: row.item,
          deadline: row.expectedOffShelfAt,
          remaining: row.remaining,
          unit: row.unit,
        })),
      },
      {
        key: 'daily-completed',
        label: '日常',
        title: '剩餘需求已歸零',
        type: 'normal',
        items: (dailyCompleted.data ?? []).map((row) => ({
          id: String(row.id),
          name: row.item,
          deadline: null,
          remaining: row.remaining,
          unit: row.unit,
        })),
      },
      {
        key: 'disaster-expiring',
        label: '災害物資',
        title: '募集即將截止',
        type: 'emergency',
        items: (disasterExpiring.data ?? []).map((row) => ({
          id: String(row.id),
          name: row.item,
          deadline: row.expectedOffShelfAt,
          remaining: null,
          unit: '',
        })),
      },
      {
        key: 'volunteer-expiring',
        label: '災害志工',
        title: '即將下架',
        type: 'emergency',
        items: (volunteerExpiring.data ?? []).map((row) => ({
          id: String(row.id),
          name: row.workContent || row.type,
          deadline: row.offShelfAt,
          remaining: null,
          unit: '',
        })),
      },
    ];

    return groups.filter((group) => group.items.length > 0);
  }

  private async getPublishedDailyDemandCount(): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('agency_daily_supply_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', '上架');

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async getPendingItemReviewCount(): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('donor_daily_donations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_human_review');

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async getPublishedEmergencyMaterialCount(): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('agency_disaster_supply_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', '上架');

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async getPublishedEmergencyVolunteerCount(): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('agency_disaster_volunteer_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', '上架');

    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}
