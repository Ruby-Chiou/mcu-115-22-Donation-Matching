import { Component, inject, signal } from '@angular/core';
import { DonorDisasterCardListComponent } from '../../data-list/donor-disaster-card-list/donor-disaster-card-list.component';
import { DisasterControlService } from '../../../core/services/disaster-control.service';

@Component({
  selector: 'app-donor-disaster-page',
  imports: [DonorDisasterCardListComponent],
  templateUrl: './donor-disaster-page.component.html',
  styleUrl: './donor-disaster-page.component.scss',
})

export class DonorDisasterPageComponent {

  showFilterModal = false;
  categoryOptions = [
    '食物',
    '衣物',
    '醫療',
    '嬰幼兒',
    '生活用品',
    '其他'
  ];
  priorityOptions = [
    '普通',
    '緊急',
    '非常緊急'
  ];
  volunteerTypeOptions = [
    '物資搬運',
    '物資整理',
    '環境清潔',
    '災民陪伴'
  ];
  volunteerLocationOptions = [
    '花蓮市',
    '光復鄉'
  ];
  materialFilters = {
    // 類別
    category: [] as string[],
    // 優先度
    priority: [] as string[],
    // 是否只顯示有剩餘需求
    hasRemaining: false
  };
  volunteerFilters = {
    // 服務類型
    volunteerType: [] as string[],
    // 服務地點
    volunteerLocation: [] as string[],
    // 是否只顯示有剩餘名額
    hasRemaining: false
  };
  openFilterModal(): void {
    this.showFilterModal = true;
  }
  closeFilterModal(): void {
    this.showFilterModal = false;
  }
  toggleMaterialFilter(
    type: 'category' | 'priority',
    value: string
  ): void {
    const list = this.materialFilters[type];
    const index = list.indexOf(value);
    // 已經選擇 → 取消
    if (index !== -1) {
      list.splice(index, 1);
    }
    // 尚未選擇 → 加入
    else {
      list.push(value);
    }
  }
  toggleVolunteerFilter(
    type: 'volunteerType' | 'volunteerLocation',
    value: string
  ): void {
    const list = this.volunteerFilters[type];
    const index = list.indexOf(value);
    // 已經選擇 → 取消
    if (index !== -1) {
      list.splice(index, 1);
    }
    // 尚未選擇 → 加入
    else {
      list.push(value);
    }
  }
  resetFilters(): void {
    // 目前在物資頁面
    if (this.activeType() === 'material') {
      this.materialFilters = {
        category: [],
        priority: [],
        hasRemaining: false
      };
    }
    // 目前在志工頁面
    else {
      this.volunteerFilters = {
        volunteerType: [],
        volunteerLocation: [],
        hasRemaining: false
      };
    }
  }
  applyFilters(): void {
    if (this.activeType() === 'material') {
      console.log(
        '物資篩選條件：',
        this.materialFilters
      );
    }
    else {
      console.log(
        '志工篩選條件：',
        this.volunteerFilters
      );
    }
    // 關閉 Modal
    this.showFilterModal = false;
  }
  protected readonly activeType =
    signal<'material' | 'volunteer'>('material');
  protected readonly disasterData =
    inject(DisasterControlService).data;
  protected selectType(
    type: 'material' | 'volunteer'
  ): void {
    this.activeType.set(type);
  }
  protected goToMap(): void {
    document
      .getElementById('disaster-map-section')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }
}
