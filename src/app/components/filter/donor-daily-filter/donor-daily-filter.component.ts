import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterBaseComponent } from '../../../shared/filter/filter-base/filter-base.component';

export interface DailyFilter {
  categories: string[];
  targets: string[];
  regions: string[];
  receiveMethods: string[];
  priorities: string[];
}

@Component({
  selector: 'app-donor-daily-filter',
  standalone: true,
  imports: [CommonModule, FilterBaseComponent],
  templateUrl: './donor-daily-filter.component.html',
  styleUrl: './donor-daily-filter.component.scss',
})
export class DonorDailyFilterComponent {
  @Output() filterChange = new EventEmitter<DailyFilter>(); // 注意這裡名字要一致

  categoryOptions = [
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

  targetOptions = ['老人', '嬰幼兒', '孩童', '青少年', '身障', '貧困', '重症照護', '寵物', '無家者', '其他'];

  regionOptions = [
    '臺北市',
    '新北市',
    '桃園市',
    '臺中市',
    '臺南市',
    '高雄市',
    '基隆市',
    '新竹市',
    '新竹縣',
    '宜蘭縣',
    '苗栗縣',
    '彰化縣',
    '南投縣',
    '雲林縣',
    '嘉義市',
    '嘉義縣',
    '屏東縣',
    '花蓮縣',
    '臺東縣',
    '離島地區',
  ];

  receiveMethodOptions = ['寄送', '面交'];

  priorityMethodOptions = ['非常緊急', '緊急', '普通'];

  // 這裡保留原本的選項和 toggle 方法
  selectedCategories: string[] = [];
  selectedTargets: string[] = [];
  selectedRegions: string[] = [];
  selectedReceiveMethods: string[] = [];
  selectedPriorities: string[] = [];

  emitFilter(): void {
    this.filterChange.emit({
      categories: [...this.selectedCategories],
      targets: [...this.selectedTargets],
      regions: [...this.selectedRegions],
      receiveMethods: [...this.selectedReceiveMethods],
      priorities: [...this.selectedPriorities],
    });
  }
}
