import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelperDemand, HelperStatus, DisplayHelperStatus } from '../../../models/agency/helper-demand';

export interface HelperFilterState {
  status: DisplayHelperStatus[];
  priority: HelperDemand['priority'][];
  lowRemaining: boolean;
  type: string[];
  messageStatus: string[];
}

@Component({
  selector: 'app-helper-filter',
  imports: [CommonModule],
  templateUrl: './helper-filter.component.html',
  styleUrl: './helper-filter.component.scss',
})
export class HelperFilterComponent {
  @Input() statusOptions: DisplayHelperStatus[] = [];

  @Input() priorityOptions: HelperDemand['priority'][] = [];

  @Input() typeOptions: NonNullable<HelperDemand['type']>[] = [];

  @Input() messageOptions: string[] = [];

  @Input() selectedFilters: HelperFilterState = {
    status: [],
    priority: [],
    lowRemaining: false,
    type: [],
    messageStatus: [],
  };

  @Output() filterApply = new EventEmitter<HelperFilterState>();

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
  toggleFilter(key: 'status' | 'priority' | 'messageStatus' | 'type', value: string) {
    const filters = this.selectedFilters[key] as string[];

    const index = filters.indexOf(value);

    if (index > -1) {
      filters.splice(index, 1);
    } else {
      filters.push(value);
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
      type: [],
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
