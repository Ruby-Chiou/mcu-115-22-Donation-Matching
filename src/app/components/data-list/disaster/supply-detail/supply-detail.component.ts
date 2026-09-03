import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DisasterDemandService } from '../../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../../models/agency/disaster-demand';

import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-supply-detail',
  imports: [CommonModule, RouterLink, SupplyDeleteComponent, SupplyImagePreviewComponent],
  templateUrl: './supply-detail.component.html',
  styleUrl: './supply-detail.component.scss',
})
export class SupplyDetailComponent implements OnInit, AfterViewInit {
  demand?: DisasterDemand;
  showDeleteModal: boolean = false;
  listNumber?: number;
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  constructor(
    private route: ActivatedRoute,
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const serialNo = Number(this.route.snapshot.paramMap.get('serialNo'));

    this.listNumber = Number(this.route.snapshot.queryParamMap.get('number'));

    this.demand = this.service.getDemandBySerialNo(serialNo);

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount ?? 0;

      // 只有資料庫有 conditionDescription 時才進行解析
      if (this.demand.conditionDescription?.trim()) {
        this.parseConditionDescription();
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
    this.router.navigate(['/agency/disaster']);
  }

  goBack() {
    this.router.navigate(['/agency/disaster']);
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

  // 將資料庫單一欄位 conditionDescription
  // 還原成前端查看頁使用的 conditions + customConditions
  parseConditionDescription(): void {
    if (!this.demand) {
      return;
    }

    const description = this.demand.conditionDescription?.trim();

    // 初始化前端顯示用資料
    this.demand.conditions = {
      全新: '',
      二手: '',
      有擦痕: '',
      過期: '',
      毀損: '',
    };

    this.demand.customConditions = [];

    if (!description) {
      return;
    }

    const conditionLabels: (keyof DisasterDemand['conditions'])[] = ['全新', '二手', '有擦痕', '過期', '毀損'];

    const parts = description.split('、');

    parts.forEach((part) => {
      const value = part.trim();

      if (!value) {
        return;
      }

      // 判斷是否為接受物資狀態
      const matchedLabel = conditionLabels.find((label) => value.startsWith(label));

      if (matchedLabel) {
        const symbol = value.slice(matchedLabel.length);

        if (symbol === '✔') {
          this.demand!.conditions[matchedLabel] = '接受';
          return;
        }

        if (symbol === '✘') {
          this.demand!.conditions[matchedLabel] = '不接受';
          return;
        }
      }

      // 不是固定接受物資狀態
      // → 視為其它物資需求狀態
      this.demand!.customConditions!.push(value);
    });
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

  // 檢查是否有設定聯絡時間
  hasContactTime(): boolean {
    if (!this.demand) {
      return false;
    }

    if (this.demand.contactTimeDifferent) {
      return !!(
        this.demand.weekdayMorning ||
        this.demand.weekdayAfternoon ||
        this.demand.weekdayEvening ||
        this.demand.weekendMorning ||
        this.demand.weekendAfternoon ||
        this.demand.weekendEvening
      );
    }

    return !!(this.demand.contactTimeMorning || this.demand.contactTimeAfternoon || this.demand.contactTimeEvening);
  }

  // 取得聯絡時間文字
  getContactTimeText(): string {
    if (!this.demand) {
      return '無';
    }

    const result: string[] = [];

    // 不區分平日、假日
    if (!this.demand.contactTimeDifferent) {
      const times: string[] = [];

      if (this.demand.contactTimeMorning) {
        times.push('上午 08:00～12:00');
      }

      if (this.demand.contactTimeAfternoon) {
        times.push('下午 12:00～18:00');
      }

      if (this.demand.contactTimeEvening) {
        times.push('晚上 18:00～22:00');
      }

      if (times.length > 0) {
        result.push(`時段：${times.join('、')}`);
      }

      return result.join(' ｜ ') || '無';
    }

    // 區分平日、假日
    const weekdayTimes: string[] = [];
    const weekendTimes: string[] = [];

    if (this.demand.weekdayMorning) {
      weekdayTimes.push('上午 08:00～12:00');
    }

    if (this.demand.weekdayAfternoon) {
      weekdayTimes.push('下午 12:00～18:00');
    }

    if (this.demand.weekdayEvening) {
      weekdayTimes.push('晚上 18:00～22:00');
    }

    if (this.demand.weekendMorning) {
      weekendTimes.push('上午 08:00～12:00');
    }

    if (this.demand.weekendAfternoon) {
      weekendTimes.push('下午 12:00～18:00');
    }

    if (this.demand.weekendEvening) {
      weekendTimes.push('晚上 18:00～22:00');
    }

    if (weekdayTimes.length > 0) {
      result.push(`平日：${weekdayTimes.join('、')}`);
    }

    if (weekendTimes.length > 0) {
      result.push(`假日：${weekendTimes.join('、')}`);
    }

    return result.join(' ｜ ') || '無';
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
