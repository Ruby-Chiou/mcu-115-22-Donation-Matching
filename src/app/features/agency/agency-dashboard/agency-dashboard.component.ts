import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLATFORM_ANNOUNCEMENTS, PLATFORM_NEWS, PlatformAnnouncement } from '../../../core/content/platform-feed';
import { PlatformAnnouncementService } from '../../../core/services/admin/platform-announcement.service';
import {
  AgencyDashboardService,
  AgencyDashboardSummary,
  DashboardReminderGroup,
  UrgentDailyNeed,
} from '../../../core/services/agency-dashboard/agency-dashboard.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

interface DashboardCard {
  title: string;
  value: number | null;
  unit: string;
  description: string;
  route?: string;
  icon: string;
  type: 'normal' | 'emergency';
  isAvailable: boolean;
  materialCount?: number;
  volunteerCount?: number;
}

@Component({
  selector: 'app-agency-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './agency-dashboard.component.html',
  styleUrl: './agency-dashboard.component.scss',
})
export class AgencyDashboardComponent implements OnInit {
  private readonly disaster = inject(DisasterControlService);
  private readonly announcementService = inject(PlatformAnnouncementService);

  protected readonly announcements = signal<PlatformAnnouncement[]>([...PLATFORM_ANNOUNCEMENTS]);
  protected readonly latestNews = PLATFORM_NEWS;

  protected get disasterOpen(): boolean {
    return this.disaster.data().isOpen;
  }

  cards: DashboardCard[] = [
    {
      title: '日常需求',
      value: null,
      unit: '項',
      description: '正在載入…',
      route: '/agency/daily',
      icon: 'fa-solid fa-box',
      type: 'normal',
      isAvailable: true,
    },
    {
      title: '待審核物資',
      value: null,
      unit: '筆',
      description: '正在載入…',
      route: '/agency/item-review',
      icon: 'fa-solid fa-clipboard-check',
      type: 'normal',
      isAvailable: true,
    },
    {
      title: '待審核發票',
      value: null,
      unit: '筆',
      description: '正在載入…',
      route: '/agency/receipt-review',
      icon: 'fa-solid fa-receipt',
      type: 'normal',
      isAvailable: true,
    },
    {
      title: '待確認收件',
      value: null,
      unit: '筆',
      description: '正在載入…',
      route: '/agency/delivery-confirm',
      icon: 'fa-solid fa-truck',
      type: 'normal',
      isAvailable: true,
    },
    {
      title: '災害需求',
      value: null,
      unit: '',
      description: '正在載入…',
      route: '/agency/disaster',
      icon: 'fa-solid fa-triangle-exclamation',
      type: 'emergency',
      isAvailable: true,
      materialCount: 0,
      volunteerCount: 0,
    },
  ];

  // 非常緊急日常需求
  urgentDailyNeeds: UrgentDailyNeed[] = [];
  isUrgentNeedsLoading = true;
  urgentNeedsError = '';

  // 待辦提醒
  reminderGroups: DashboardReminderGroup[] = [];
  isRemindersLoading = true;
  remindersError = '';

  constructor(
    private readonly agencyDashboardService: AgencyDashboardService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadDashboardSummary(),
      this.loadUrgentDailyNeeds(),
      this.loadReminders(),
      this.loadAnnouncements(),
    ]);
  }

  private async loadAnnouncements(): Promise<void> {
    try {
      this.announcements.set(await this.announcementService.published());
    } catch (error) {
      console.error('載入平台公告失敗：', error);
    }
  }

  // 載入五張卡片統計
  private async loadDashboardSummary(): Promise<void> {
    try {
      const summary = await this.agencyDashboardService.getSummary();

      this.updateCards(summary);
    } catch (error) {
      console.error('載入社福機構總控台失敗：', error);

      this.cards = this.cards.map((card) => {
        if (!card.isAvailable) {
          return card;
        }

        return {
          ...card,
          description: '資料載入失敗',
        };
      });
    } finally {
      this.cdr.markForCheck();
    }
  }

  // 載入非常緊急日常需求
  private async loadUrgentDailyNeeds(): Promise<void> {
    this.isUrgentNeedsLoading = true;
    this.urgentNeedsError = '';

    try {
      this.urgentDailyNeeds = await this.agencyDashboardService.getUrgentDailyNeeds();
    } catch (error) {
      console.error('載入非常緊急日常需求失敗：', error);

      this.urgentNeedsError = '需求資料載入失敗，請稍後重新整理。';
    } finally {
      this.isUrgentNeedsLoading = false;
      this.cdr.markForCheck();
    }
  }

  // 載入四組待辦提醒
  private async loadReminders(): Promise<void> {
    this.isRemindersLoading = true;
    this.remindersError = '';

    try {
      this.reminderGroups = await this.agencyDashboardService.getReminders();
    } catch (error) {
      console.error('載入待辦提醒失敗：', error);

      this.remindersError = '提醒資料載入失敗，請稍後重新整理。';
    } finally {
      this.isRemindersLoading = false;
      this.cdr.markForCheck();
    }
  }

  // 更新卡片內容
  private updateCards(summary: AgencyDashboardSummary): void {
    this.cards = this.cards.map((card) => {
      switch (card.title) {
        case '日常需求':
          return summary.dailyDemandCount === null
            ? { ...card, value: null, description: '資料載入失敗' }
            : {
                ...card,
                value: summary.dailyDemandCount,
                description: '目前已上架的日常需求',
              };

        case '待審核物資':
          return summary.pendingItemReviewCount === null
            ? { ...card, value: null, description: '資料載入失敗' }
            : {
                ...card,
                value: summary.pendingItemReviewCount,
                description: '需要人工審核',
              };

        case '待審核發票':
          return {
            ...card,
            value: summary.pendingReceiptReviewCount,
            description: '待開立收據或上傳感謝狀',
          };

        case '待確認收件':
          return {
            ...card,
            value: summary.pendingReceivingCount,
            description: '已通過、貨到後可以簽收',
          };

        case '災害需求':
          return {
            ...card,
            materialCount: summary.emergencyMaterialCount ?? 0,
            volunteerCount: summary.emergencyVolunteerCount ?? 0,
            description: '目前已上架的災害救助需求',
          };

        default:
          return card;
      }
    });
  }

  // 計算收件進度
  getReceivedProgress(need: UrgentDailyNeed): number | null {
    if (need.receivedQuantity === null || need.requiredQuantity <= 0) {
      return null;
    }

    const percentage = (need.receivedQuantity / need.requiredQuantity) * 100;

    return Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));
  }
}
