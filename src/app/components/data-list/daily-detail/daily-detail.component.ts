import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { SupplyDeleteComponent } from '../../modal/supply-delete/supply-delete.component';
import { ImagePreviewComponent } from '../../modal/image-preview/image-preview.component';

@Component({
  selector: 'app-daily-detail',
  imports: [CommonModule, RouterLink, SupplyDeleteComponent, ImagePreviewComponent],
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
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.listNumber = Number(this.route.snapshot.queryParamMap.get('number'));

    this.demand = this.service.getDemandById(id);

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount ?? 0;
      this.demand.customConditions ??= [];
      this.demand.customServiceTargets ??= [];
      if (this.demand) {
        this.demand.remaining ??= this.demand.amount ?? 0;
        this.demand.customConditions ??= [];
        this.demand.customServiceTargets ??= [];

        this.demand.serviceTargets ??= {
          老人: false,
          嬰幼兒: false,
          孩童: false,
          青少年: false,
          身障: false,
          貧困: false,
          重症照護: false,
          動物: false,
          無家者: false,
        };
      }
    }
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
    return this.demand?.id != null ? [this.demand.id] : [];
  }

  // 取得勾選的服務對象，以頓號連結；若皆無則回傳 '無'
  getSelectedServiceTargets(): string {
    if (!this.demand) {
      return '無';
    }

    const selected = Object.entries(this.demand.serviceTargets || {})
      .filter(([_, value]) => value)
      .map(([key]) => key);

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

  // 取得其他物品狀態文字
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

    return !!(
      this.demand.contactTimeWeekday ||
      this.demand.contactTimeWeekend ||
      this.demand.contactTimeMorning ||
      this.demand.contactTimeAfternoon ||
      this.demand.contactTimeEvening
    );
  }

  // 取得聯絡時間文字
  getContactTimeText(): string {
    if (!this.demand) {
      return '無';
    }

    const dates: string[] = [];
    const times: string[] = [];

    // 日期
    if (this.demand.contactTimeWeekday) {
      dates.push('平日');
    }

    if (this.demand.contactTimeWeekend) {
      dates.push('假日');
    }

    // 時段
    if (this.demand.contactTimeMorning) {
      times.push('上午 08:00～12:00');
    }

    if (this.demand.contactTimeAfternoon) {
      times.push('下午 12:00～18:00');
    }

    if (this.demand.contactTimeEvening) {
      times.push('晚上 18:00～22:00');
    }

    const result: string[] = [];

    if (dates.length > 0) {
      result.push(`日期：${dates.join('、')}`);
    }

    if (times.length > 0) {
      result.push(`時段：${times.join('、')}`);
    }

    return result.join(' ｜ ');
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
            `${condition.name}：<span class="${condition.value === '接受' ? 'accept' : 'reject'}">${this.getConditionIcon(condition.value)}</span> ${condition.value}`
        )
        .join(' ｜ ') || '無'
    );
  }
}
