import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisasterDemand, DisplayStatus } from '../../../models/agency/demand';

export interface SupplyFilterState {
  status: string[];
  priority: string[];
  lowRemaining: boolean;
  category: string[];
  messageStatus: string[];
}

@Component({
  selector: 'app-supply-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-filter.component.html',
  styleUrls: ['./supply-filter.component.scss'],
})
export class SupplyFilterComponent {
  @Input() statusOptions: DisplayStatus[] = [];

  @Input() priorityOptions: DisasterDemand['priority'][] = [];

  @Input() categoryOptions: NonNullable<DisasterDemand['category']>[] = [];

  @Input() messageOptions: string[] = [];

  @Input() selectedFilters: SupplyFilterState = {
    status: [],
    priority: [],
    lowRemaining: false,
    category: [],
    messageStatus: [],
  };

  @Output() filterApply = new EventEmitter<SupplyFilterState>();

  @Output() filterReset = new EventEmitter<void>();

  showFilterModal = false;

  // 開啟條件篩選
  openFilterModal() {
    this.showFilterModal = true;
  }

  // 關閉條件篩選
  closeFilterModal() {
    this.showFilterModal = false;
  }

  // 切換篩選條件
  toggleFilter(key: 'status' | 'priority' | 'category' | 'messageStatus', value: string) {
    const index = this.selectedFilters[key].indexOf(value);

    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }
  }

  // 切換剩餘數量
  toggleLowRemaining() {
    this.selectedFilters.lowRemaining = !this.selectedFilters.lowRemaining;
  }

  // 重置篩選
  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };

    this.filterReset.emit();
  }

  // 確定篩選
  applyFilters() {
    this.filterApply.emit(this.selectedFilters);
    this.showFilterModal = false;
  }
}
