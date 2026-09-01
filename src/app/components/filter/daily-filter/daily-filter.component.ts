import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyDemand, DailyDisplayStatus } from '../../../models/agency/daily-demand';

type ReceiveMethod = '寄送' | '面交';

@Component({
  selector: 'app-daily-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-filter.component.html',
  styleUrl: './daily-filter.component.scss',
})
export class DailyFilterComponent {
  // 是否開啟篩選 Modal
  @Input() showFilterModal = false;

  // 篩選選項
  @Input() statusOptions: DailyDisplayStatus[] = ['已上架', '隱藏中', '已下架'];

  @Input() priorityOptions: DailyDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  @Input() categoryOptions: NonNullable<DailyDemand['category']>[] = [
    '食品與飲用水',
    '衣物與保暖用品',
    '醫療與照護用品',
    '清潔與衛生用品',
    '嬰幼兒用品',
    '長者與身心障礙用品',
    '女性生理用品',
    '寵物與動物用品',
    '防災與照明用品',
    '通訊與求救用品',
    '生活與炊事用品',
    '居住安置與修繕用品',
    '其他',
  ];

  @Input() messageOptions: string[] = ['已回覆', '未回覆'];

  @Input() receiveMethodOptions: ReceiveMethod[] = ['寄送', '面交'];

  // 目前選擇的篩選條件
  @Input() selectedFilters = {
    status: [] as string[],
    priority: [] as string[],
    receiveMethod: [] as ReceiveMethod[],
    lowRemaining: false,
    category: [] as string[],
    messageStatus: [] as string[],
  };

  // 開啟篩選 Modal
  @Output() open = new EventEmitter<void>();

  // 關閉篩選 Modal
  @Output() close = new EventEmitter<void>();

  // 套用篩選
  @Output() apply = new EventEmitter<void>();

  // 重置篩選
  @Output() reset = new EventEmitter<void>();

  // 點擊篩選按鈕
  openFilterModal() {
    this.open.emit();
  }

  // 關閉 Modal
  closeFilterModal() {
    this.close.emit();
  }

  // 切換篩選條件
  toggleFilter(key: 'status' | 'priority' | 'receiveMethod' | 'category' | 'messageStatus', value: string) {
    const filters = this.selectedFilters[key] as string[];

    const index = filters.indexOf(value);

    if (index > -1) {
      filters.splice(index, 1);
    } else {
      filters.push(value);
    }
  }

  // 重置篩選
  resetFilters() {
    this.reset.emit();
  }

  // 套用篩選
  applyFilters() {
    this.apply.emit();
  }
}
