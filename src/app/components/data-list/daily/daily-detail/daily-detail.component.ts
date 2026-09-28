import { ChangeDetectorRef, Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyDemand } from '../../../../models/agency/daily-demand';

import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-daily-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SupplyDeleteComponent, SupplyImagePreviewComponent],
  templateUrl: './daily-detail.component.html',
  styleUrl: './daily-detail.component.scss',
})
export class DailyDetailComponent implements OnInit, AfterViewInit {
  demand?: DailyDemand;

  showDeleteModal: boolean = false;

  listNumber?: number;

  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: DailyDemandService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  isLoading = true;
  loadError = '';

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    const id = Number(rawId);

    console.log('[DailyDetailComponent] 取得路由資料庫 id：', {
      rawId,
      id,
    });

    if (!Number.isInteger(id) || id <= 0) {
      this.isLoading = false;

      this.loadError = '網址中的資料編號不正確。';

      this.cdr.detectChanges();

      return;
    }

    try {
      const loadedDemand = await this.service.getDemandById(id);

      console.log('[DailyDetailComponent] Service 回傳資料：', loadedDemand);

      if (!loadedDemand) {
        this.loadError = '找不到這筆日常物資需求資料。';

        return;
      }

      this.demand = {
        ...loadedDemand,

        remaining: loadedDemand.remaining ?? loadedDemand.amount ?? 0,

        customConditions: [...(loadedDemand.customConditions ?? [])],

        customServiceTargets: [...(loadedDemand.customServiceTargets ?? [])],

        serviceTargets: [...(loadedDemand.serviceTargets ?? [])],
      };

      this.listNumber = this.demand.serialNo;

      console.log('[DailyDetailComponent] 已設定 this.demand：', this.demand);

      console.log('[DailyDetailComponent] conditions：', this.demand?.conditions);

      console.log('[DailyDetailComponent] conditions text：', this.getConditionsText());
    } catch (error) {
      console.error('載入日常物資詳細資料失敗：', error);

      this.loadError = '資料載入失敗，請確認網路、Supabase 連線或資料庫權限。';
    } finally {
      this.isLoading = false;

      /*
       * 讓 F5 後非同步 Supabase 查詢完成時，
       * 立即更新 *ngIf 與詳細資料畫面。
       */
      this.cdr.detectChanges();
    }
  }

  getConditionDescription(): string {
    if (!this.demand) {
      return '無';
    }

    const conditions = [
      { name: '全新', value: this.demand.conditions?.全新 },
      { name: '二手', value: this.demand.conditions?.二手 },
      { name: '有擦痕', value: this.demand.conditions?.有擦痕 },
      { name: '過期', value: this.demand.conditions?.過期 },
      { name: '毀損', value: this.demand.conditions?.毀損 },
    ];

    const result: string[] = [];

    conditions.forEach((condition) => {
      if (condition.value === '接受') {
        result.push(`${condition.name}✓`);
      } else if (condition.value === '不接受') {
        result.push(`${condition.name}✗`);
      }
    });

    (this.demand.customConditions || []).forEach((condition) => {
      const value = condition.trim();
      if (value) {
        result.push(value);
      }
    });

    return result.length > 0 ? result.join('、') : '無';
  }

  ngAfterViewInit() {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }, 100);
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  onDeleted() {
    this.showDeleteModal = false;
    this.router.navigate(['/agency/daily']);
  }

  goBack() {
    this.router.navigate(['/agency/daily']);
  }

  openImagePreview(image: string, imageName: string) {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }

  getDeleteIds(): number[] {
    return this.demand?.id != null ? [this.demand.id] : [];
  }

  getSelectedServiceTargets(): string {
    if (!this.demand) {
      return '無';
    }

    const selected = Array.isArray(this.demand.serviceTargets)
      ? this.demand.serviceTargets.filter((target) => typeof target === 'string' && target.trim() !== '').map((target) => target.trim())
      : [];

    return selected.length > 0 ? selected.join('、') : '無';
  }

  hasCustomServiceTargets(): boolean {
    return (
      Array.isArray(this.demand?.customServiceTargets) &&
      this.demand.customServiceTargets.some((target: string) => target && target.trim() !== '')
    );
  }

  getCustomServiceTargets(): string {
    return this.demand?.customServiceTargets?.filter((target) => target && target.trim()).join('、') || '無';
  }

  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some((condition: string) => condition && condition.trim() !== '')
    );
  }

  getCustomConditions(): string {
    return this.demand?.customConditions?.filter((condition) => condition && condition.trim()).join('、') || '無';
  }

  getConditionClass(condition?: string) {
    if (condition === '接受') {
      return 'accept';
    }
    if (condition === '不接受') {
      return 'reject';
    }
    return '';
  }

  getConditionIcon(condition?: string) {
    if (condition === '接受') {
      return '✔';
    }
    if (condition === '不接受') {
      return '✘';
    }
    return '';
  }

  hasContactTime(): boolean {
    if (!this.demand) {
      return false;
    }

    if (!this.demand.contactTimeSeparate) {
      return !!(this.demand.contactTimeMorning || this.demand.contactTimeAfternoon || this.demand.contactTimeEvening);
    }

    return !!(
      this.demand.contactTimeWeekdayMorning ||
      this.demand.contactTimeWeekdayAfternoon ||
      this.demand.contactTimeWeekdayEvening ||
      this.demand.contactTimeWeekendMorning ||
      this.demand.contactTimeWeekendAfternoon ||
      this.demand.contactTimeWeekendEvening
    );
  }

  getContactTimeText(): string {
    if (!this.demand) {
      return '無';
    }

    const getTimeText = (morning: boolean, afternoon: boolean, evening: boolean): string => {
      const times: string[] = [];
      if (morning) {
        times.push('上午 08:00～12:00');
      }
      if (afternoon) {
        times.push('下午 12:00～18:00');
      }
      if (evening) {
        times.push('晚上 18:00～22:00');
      }
      return times.length > 0 ? times.join('、') : '無';
    };

    if (!this.demand.contactTimeSeparate) {
      const timeText = getTimeText(this.demand.contactTimeMorning, this.demand.contactTimeAfternoon, this.demand.contactTimeEvening);
      return timeText === '無' ? '無' : `時段：${timeText}`;
    }

    const weekdayText = getTimeText(
      this.demand.contactTimeWeekdayMorning,
      this.demand.contactTimeWeekdayAfternoon,
      this.demand.contactTimeWeekdayEvening
    );

    const weekendText = getTimeText(
      this.demand.contactTimeWeekendMorning,
      this.demand.contactTimeWeekendAfternoon,
      this.demand.contactTimeWeekendEvening
    );

    const result: string[] = [];
    if (weekdayText !== '無') {
      result.push(`平日：${weekdayText}`);
    }
    if (weekendText !== '無') {
      result.push(`假日：${weekendText}`);
    }

    return result.length > 0 ? result.join(' ｜ ') : '無';
  }

  getConditionsText(): string {
    if (!this.demand || !this.demand.conditions) {
      return '無';
    }

    const conditions = [
      { name: '全新', value: this.demand.conditions['全新'] },
      { name: '二手', value: this.demand.conditions['二手'] },
      { name: '有擦痕', value: this.demand.conditions['有擦痕'] },
      { name: '過期', value: this.demand.conditions['過期'] },
      { name: '毀損', value: this.demand.conditions['毀損'] },
    ];

    return (
      conditions
        .filter((condition) => condition.value)
        .map(
          (condition) =>
            `${condition.name}：<span class="${condition.value === '接受' ? 'accept' : 'reject'}">${this.getConditionIcon(
              condition.value
            )}</span> ${condition.value}`
        )
        .join(' ｜ ') || '無'
    );
  }
}
