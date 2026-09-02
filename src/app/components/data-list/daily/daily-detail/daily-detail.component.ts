import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DailyDemandService } from '../../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyDeleteComponent } from '../../../modal/supply-delete/supply-delete.component';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-daily-detail',
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
    private route: ActivatedRoute,
    private service: DailyDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const serialNo = Number(this.route.snapshot.paramMap.get('serialNo'));

    this.demand = this.service.getDemandById(serialNo);

    this.listNumber = this.demand?.serialNo;

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount ?? 0;

      this.demand.customConditions ??= [];

      this.demand.customServiceTargets ??= [];

      /*
       * 需求對象現在改成陣列：
       *
       * serviceTargets: ['老人', '孩童', '貧困']
       *
       * 不再使用：
       *
       * serviceTargets: {
       *   老人: true,
       *   嬰幼兒: false,
       *   ...
       * }
       */
      this.demand.serviceTargets ??= [];
    }
  }

  /**
   * 取得需求對象完整文字
   *
   * 例如：
   * serviceTargets = ['老人', '孩童', '貧困']
   *
   * 顯示：
   * 老人、孩童、貧困
   */
  getServiceTargetDescription(): string {
    if (!this.demand) {
      return '無';
    }

    const result: string[] = [];

    /*
     * 固定需求對象現在直接從陣列取得
     */
    (this.demand.serviceTargets || []).forEach((target) => {
      const value = target.trim();

      if (value) {
        result.push(`${value}✓`);
      }
    });

    /*
     * 其他自訂需求對象
     */
    (this.demand.customServiceTargets || []).forEach((target) => {
      const value = target.trim();

      if (value) {
        result.push(value);
      }
    });

    return result.length > 0 ? result.join('、') : '無';
  }

  getConditionDescription(): string {
    if (!this.demand) {
      return '無';
    }

    const conditions = [
      {
        name: '全新',
        value: this.demand.conditions?.全新,
      },
      {
        name: '二手',
        value: this.demand.conditions?.二手,
      },
      {
        name: '有擦痕',
        value: this.demand.conditions?.有擦痕,
      },
      {
        name: '過期',
        value: this.demand.conditions?.過期,
      },
      {
        name: '毀損',
        value: this.demand.conditions?.毀損,
      },
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

  // 開啟刪除視窗
  openDeleteModal() {
    this.showDeleteModal = true;
  }

  // 關閉刪除視窗
  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  // 刪除完成後返回列表
  onDeleted() {
    this.showDeleteModal = false;

    this.router.navigate(['/agency/daily']);
  }

  goBack() {
    this.router.navigate(['/agency/daily']);
  }

  // 開啟圖片預覽
  openImagePreview(image: string, imageName: string) {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  // 關閉圖片預覽
  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }

  getDeleteIds(): number[] {
    return this.demand?.serialNo != null ? [this.demand.serialNo] : [];
  }

  /**
   * 取得勾選的需求對象
   *
   * 現在 serviceTargets 是陣列，例如：
   *
   * ['老人', '孩童', '貧困']
   *
   * 直接 join 成：
   *
   * 老人、孩童、貧困
   */
  getSelectedServiceTargets(): string {
    if (!this.demand) {
      return '無';
    }

    const selected = Array.isArray(this.demand.serviceTargets)
      ? this.demand.serviceTargets.filter((target) => typeof target === 'string' && target.trim() !== '').map((target) => target.trim())
      : [];

    return selected.length > 0 ? selected.join('、') : '無';
  }

  // 檢查是否有有效填寫的其他服務對象
  hasCustomServiceTargets(): boolean {
    return (
      Array.isArray(this.demand?.customServiceTargets) &&
      this.demand.customServiceTargets.some((target: string) => target && target.trim() !== '')
    );
  }

  // 取得其他自訂服務對象文字
  getCustomServiceTargets(): string {
    return this.demand?.customServiceTargets?.filter((target) => target && target.trim()).join('、') || '無';
  }

  // 檢查是否有有效填寫的其他物品狀態
  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some((condition: string) => condition && condition.trim() !== '')
    );
  }

  // 取得其他自訂物品狀態文字
  getCustomConditions(): string {
    return this.demand?.customConditions?.filter((condition) => condition && condition.trim()).join('、') || '無';
  }

  // 判斷接受 / 不接受顏色
  getConditionClass(condition?: string) {
    if (condition === '接受') {
      return 'accept';
    }

    if (condition === '不接受') {
      return 'reject';
    }

    return '';
  }

  // 顯示符號
  getConditionIcon(condition?: string) {
    if (condition === '接受') {
      return '✔';
    }

    if (condition === '不接受') {
      return '✘';
    }

    return '';
  }

  // 檢查是否有設定聯絡時間
  hasContactTime(): boolean {
    if (!this.demand) {
      return false;
    }

    // 不區分平日、假日
    if (!this.demand.contactTimeSeparate) {
      return !!(this.demand.contactTimeMorning || this.demand.contactTimeAfternoon || this.demand.contactTimeEvening);
    }

    // 區分平日、假日
    return !!(
      this.demand.contactTimeWeekdayMorning ||
      this.demand.contactTimeWeekdayAfternoon ||
      this.demand.contactTimeWeekdayEvening ||
      this.demand.contactTimeWeekendMorning ||
      this.demand.contactTimeWeekendAfternoon ||
      this.demand.contactTimeWeekendEvening
    );
  }

  // 取得聯絡時間文字
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

    // 不區分平日、假日
    if (!this.demand.contactTimeSeparate) {
      const timeText = getTimeText(this.demand.contactTimeMorning, this.demand.contactTimeAfternoon, this.demand.contactTimeEvening);

      return timeText === '無' ? '無' : `時段：${timeText}`;
    }

    // 區分平日、假日
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

  // 取得接受物資狀態文字
  getConditionsText(): string {
    if (!this.demand) {
      return '無';
    }

    const conditions = [
      {
        name: '全新',
        value: this.demand.conditions['全新'],
      },
      {
        name: '二手',
        value: this.demand.conditions['二手'],
      },
      {
        name: '有擦痕',
        value: this.demand.conditions['有擦痕'],
      },
      {
        name: '過期',
        value: this.demand.conditions['過期'],
      },
      {
        name: '毀損',
        value: this.demand.conditions['毀損'],
      },
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
