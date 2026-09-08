import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
// 物資篩選條件
export interface SupplyFilters {
  // 類別
  category: string[];
  // 優先度
  priority: string[];
  // 是否只顯示有剩餘需求
  hasRemaining: boolean;
}

@Component({
  selector: 'app-donor-disaster-supply-filter',
  standalone: true,
  imports: [],
  templateUrl: './donor-disaster-supply-filter.component.html',
  styleUrl: './donor-disaster-supply-filter.component.scss',
})
export class DonorDisasterSupplyFilterComponent {
  // 連接物資需求 Service
  private disasterDemandService = inject(DisasterDemandService);

  // =====================================
  // 接收 donor-disaster-page 的篩選條件
  // =====================================

  @Input()
  filters: SupplyFilters = {
    category: [],
    priority: [],
    hasRemaining: false,
  };

  // =====================================
  // 將新的篩選條件傳回 donor-disaster-page
  // =====================================

  @Output()
  filtersChange = new EventEmitter<SupplyFilters>();

  // =====================================
  // 類別選項
  //
  // 直接從後端資料的 category 取得
  // =====================================

  get categoryOptions(): string[] {
    const demands = this.disasterDemandService.getDemands();

    return [...new Set(demands.map((demand) => demand.category).filter((category) => category !== ''))];
  }

  // =====================================
  // 優先度選項
  // =====================================

  priorityOptions = ['普通', '緊急', '非常緊急'];

  // =====================================
  // 選擇 / 取消「類別」
  // =====================================

  toggleCategory(value: string): void {
    const category = this.filters.category;

    if (category.includes(value)) {
      // 已選擇 → 取消
      this.filters = {
        ...this.filters,

        category: category.filter((item) => item !== value),
      };
    } else {
      // 尚未選擇 → 加入
      this.filters = {
        ...this.filters,

        category: [...category, value],
      };
    }

    this.emitFilters();
  }

  // =====================================
  // 選擇 / 取消「優先度」
  // =====================================

  togglePriority(value: string): void {
    const priority = this.filters.priority;

    if (priority.includes(value)) {
      // 已選擇 → 取消
      this.filters = {
        ...this.filters,

        priority: priority.filter((item) => item !== value),
      };
    } else {
      // 尚未選擇 → 加入
      this.filters = {
        ...this.filters,

        priority: [...priority, value],
      };
    }

    this.emitFilters();
  }

  // =====================================
  // 是否只顯示「尚有剩餘需求」
  // =====================================

  toggleRemaining(): void {
    this.filters = {
      ...this.filters,

      hasRemaining: !this.filters.hasRemaining,
    };

    this.emitFilters();
  }

  // =====================================
  // 重置篩選
  // =====================================

  resetFilters(): void {
    this.filters = {
      category: [],
      priority: [],
      hasRemaining: false,
    };

    this.emitFilters();
  }

  // =====================================
  // 傳送篩選結果給父元件
  // =====================================

  private emitFilters(): void {
    this.filtersChange.emit({
      category: [...this.filters.category],

      priority: [...this.filters.priority],

      hasRemaining: this.filters.hasRemaining,
    });
  }
}
