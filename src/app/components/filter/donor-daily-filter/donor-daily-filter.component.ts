import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
export interface DailyFilter {
  categories: string[];
  targets: string[];
  regions: string[];
  receiveMethods: string[];
}

@Component({
  selector: 'app-donor-daily-filter',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './donor-daily-filter.component.html',
  styleUrl: './donor-daily-filter.component.scss'
})
export class DonorDailyFilterComponent {

  @Output() filterChange = new EventEmitter<DailyFilter>();

  openFilter: string | null = null;

  selectedCategories: string[] = [];
  selectedTargets: string[] = [];
  selectedRegions: string[] = [];
  selectedReceiveMethods: string[] = [];

  categoryOptions = [
    '食物',
    '衣物',
    '醫療',
    '嬰幼兒',
    '生活用品',
    '其他'
  ];

  targetOptions = [
    '老人',
    '嬰幼兒',
    '孩童',
    '青少年',
    '身障',
    '貧困',
    '重症照護',
    '寵物',
    '流浪',
    '野生'
  ];

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
    '澎湖縣',
    '金門縣',
    '連江縣'
  ];

  receiveMethodOptions = [
    '面交',
    '郵寄'
  ];

  toggleFilter(filter: string): void {
    this.openFilter =
      this.openFilter === filter
        ? null
        : filter;
  }

  toggleCategory(value: string): void {
    this.toggleValue(
      this.selectedCategories,
      value
    );
    this.emitFilter();
  }

  toggleTarget(value: string): void {
    this.toggleValue(
      this.selectedTargets,
      value
    );
    this.emitFilter();
  }

  toggleRegion(value: string): void {
    this.toggleValue(
      this.selectedRegions,
      value
    );
    this.emitFilter();
  }

  toggleReceiveMethod(value: string): void {
    this.toggleValue(
      this.selectedReceiveMethods,
      value
    );
    this.emitFilter();
  }

  private toggleValue(
    array: string[],
    value: string
  ): void {

    const index = array.indexOf(value);

    if (index >= 0) {
      array.splice(index, 1);
    } else {
      array.push(value);
    }
  }

  private emitFilter(): void {

    this.filterChange.emit({
      categories: [...this.selectedCategories],
      targets: [...this.selectedTargets],
      regions: [...this.selectedRegions],
      receiveMethods: [
        ...this.selectedReceiveMethods
      ]
    });
  }

  clearFilters(): void {

    this.selectedCategories = [];
    this.selectedTargets = [];
    this.selectedRegions = [];
    this.selectedReceiveMethods = [];

    this.openFilter = null;

    this.emitFilter();
  }

  hasFilter(): boolean {
    return (
      this.selectedCategories.length > 0 ||
      this.selectedTargets.length > 0 ||
      this.selectedRegions.length > 0 ||
      this.selectedReceiveMethods.length > 0
    );
  }

  getSelectedFilters(): string[] {
    return [
      ...this.selectedCategories,
      ...this.selectedTargets,
      ...this.selectedRegions,
      ...this.selectedReceiveMethods
    ];
  }
}
