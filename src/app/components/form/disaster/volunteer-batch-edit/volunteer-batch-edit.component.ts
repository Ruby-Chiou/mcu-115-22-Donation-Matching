import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';
import { VolunteerOffShelfComponent } from '../../../modal/shelf/volunteer-off-shelf/volunteer-off-shelf.component';
import { VolunteerOnShelfComponent } from '../../../modal/shelf/volunteer-on-shelf/volunteer-on-shelf.component';

// 讓元件專用的 UI 表單介面繼承原始的 VolunteerDemand，並擴充驗證屬性
export type VolunteerDemandItem = VolunteerDemand & {
  selected?: boolean;
  typeError?: boolean;
  peopleError?: boolean;
  locationError?: boolean;
  conditionError?: boolean;
  workContentError?: boolean;
  reasonError?: boolean;
  contactError?: boolean;
  phoneError?: boolean;
};

@Component({
  selector: 'app-volunteer-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, VolunteerOffShelfComponent, VolunteerOnShelfComponent], // 補上 CommonModule 以支援 *ngFor/*ngIf
  templateUrl: './volunteer-batch-edit.component.html',
  styleUrl: './volunteer-batch-edit.component.scss',
})
export class VolunteerBatchEditComponent implements OnInit {
  editDemands: VolunteerDemandItem[] = [];

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  private pendingDemand: VolunteerDemandItem | null = null;

  constructor(
    private volunteerDemandService: VolunteerDemandService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDataFromService();
  }

  // 從 Service 載入資料
  loadDataFromService(): void {
    const storedData = localStorage.getItem('editVolunteerDemands');

    if (!storedData) {
      alert('沒有找到要編輯的志工需求');
      this.router.navigate(['/agency/disaster']);
      return;
    }

    try {
      const selectedDemands: VolunteerDemand[] = JSON.parse(storedData);

      this.editDemands = JSON.parse(JSON.stringify(selectedDemands)).map((demand: VolunteerDemandItem) => ({
        ...demand,
        status: demand.status ?? '上架',
      }));

      console.log('批次編輯資料：', this.editDemands);
    } catch (error) {
      console.error('讀取批次編輯資料失敗：', error);
      alert('讀取編輯資料失敗');

      this.router.navigate(['/agency/disaster']);
    }
  }

  isManualOffShelf(demand: VolunteerDemandItem): boolean {
    return demand.status === '下架' && demand.offShelfReason === 'manual';
  }

  onStatusClick(event: MouseEvent, demand: VolunteerDemandItem): void {
    if (this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();

      this.pendingDemand = demand;
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect('上架', demand);
  }

  onStatusSelect(newStatus: VolunteerDemand['status'], demand: VolunteerDemandItem): void {
    // 手動下架後不能重新上架
    if (this.isManualOffShelf(demand)) {
      if (newStatus === '上架') {
        this.pendingDemand = demand;
        demand.status = '下架';
        this.showOnShelfWarning = true;
      } else {
        demand.status = '下架';
      }

      return;
    }

    // 下架 → 跳出確認視窗
    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }

      this.pendingDemand = demand;

      // 先維持原本狀態，等使用者確認
      this.showOffShelfWarning = true;

      return;
    }

    // 隱藏
    if (newStatus === '隱藏') {
      demand.status = '隱藏';
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;

      return;
    }

    // 上架
    if (newStatus === '上架') {
      demand.status = '上架';
      return;
    }
  }

  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  hideInsteadOfOffShelf(): void {
    if (!this.pendingDemand) {
      return;
    }

    this.pendingDemand.status = '隱藏';
    this.pendingDemand.publishedAt = undefined;
    this.pendingDemand.expectedOffShelfAt = undefined;
    this.pendingDemand.offShelfReason = undefined;

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  confirmManualOffShelf(): void {
    if (!this.pendingDemand) {
      return;
    }

    const now = new Date();

    this.pendingDemand.status = '下架';
    this.pendingDemand.offShelfReason = 'manual';
    this.pendingDemand.expectedOffShelfAt = now.toISOString();

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.pendingDemand) {
      this.pendingDemand.status = '下架';
      this.pendingDemand.offShelfReason = 'manual';
    }

    this.pendingDemand = null;
  }

  saveAll(): void {
    // 找出有勾選的資料
    const selectedDemands = this.editDemands.filter((demand) => demand.selected);

    // 沒有勾選
    if (selectedDemands.length === 0) {
      alert('請先勾選要編輯的志工需求！');
      return;
    }

    let isValid = true;

    // 只驗證「勾選」的資料
    selectedDemands.forEach((demand) => {
      demand.typeError = !demand.type;

      demand.peopleError = demand.people === null || demand.people === undefined || demand.people <= 0;

      demand.locationError = !demand.location?.trim();

      demand.conditionError = !demand.condition;

      demand.workContentError = !demand.workContent?.trim();

      demand.reasonError = !demand.reason?.trim();

      demand.contactError = !demand.contact?.trim();

      demand.phoneError = !demand.phone?.trim();

      // 只要有一個錯誤
      if (
        demand.typeError ||
        demand.peopleError ||
        demand.locationError ||
        demand.conditionError ||
        demand.workContentError ||
        demand.reasonError ||
        demand.contactError ||
        demand.phoneError
      ) {
        isValid = false;
      }
    });

    // 驗證失敗
    if (!isValid) {
      alert('請檢查紅框標示的必填欄位是否填寫完整！');
      return;
    }

    const now = new Date();

    selectedDemands.forEach((demand) => {
      // 手動下架不能重新上架
      if (demand.status === '上架' && demand.offShelfReason === 'manual') {
        demand.status = '下架';
        alert('此需求為使用者主動下架，無法重新上架。');
        return;
      }

      // 上架
      if (demand.status === '上架') {
        if (!demand.publishedAt) {
          demand.publishedAt = now.toISOString();
        }

        demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(demand.publishedAt), demand.priority);

        demand.offShelfReason = undefined;
      }

      // 隱藏
      else if (demand.status === '隱藏') {
        demand.publishedAt = undefined;
        demand.expectedOffShelfAt = undefined;
        demand.offShelfReason = undefined;
      }

      // 下架
      else if (demand.status === '下架') {
        if (!demand.offShelfReason) {
          demand.offShelfReason = 'manual';
        }

        if (!demand.expectedOffShelfAt) {
          demand.expectedOffShelfAt = now.toISOString();
        }
      }
    });

    // 只處理勾選的資料
    const cleanDemands: VolunteerDemand[] = selectedDemands.map(
      ({
        selected,
        typeError,
        peopleError,
        locationError,
        conditionError,
        workContentError,
        reasonError,
        contactError,
        phoneError,
        ...rest
      }) => rest
    );

    // 只更新勾選的資料
    this.volunteerDemandService.updateBatchDemands(cleanDemands);
    // 重新載入資料
    this.loadDataFromService();
    this.router.navigate(['/agency/disaster']);
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: VolunteerDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 7);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 3);
        break;
    }

    return offShelfDate.toISOString();
  }

  cancel(): void {
    this.router.navigate(['/agency/disaster']);
  }
}
