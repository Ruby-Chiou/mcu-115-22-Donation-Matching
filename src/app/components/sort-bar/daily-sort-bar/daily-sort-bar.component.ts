import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SortType = 'serialNo' | 'createdAt' | 'publishedAt' | 'expectedOffShelfAt' | 'amount' | 'remaining';

@Component({
  selector: 'app-daily-sort-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-sort-bar.component.html',
  styleUrl: './daily-sort-bar.component.scss',
})
export class DailySortBarComponent {
  @Input() selectedSort: SortType = 'serialNo';
  @Input() sortAscending = true;

  @Output() selectedSortChange = new EventEmitter<SortType>();
  @Output() sortAscendingChange = new EventEmitter<boolean>();

  isSortDropdownOpen = false;

  sortOptions: { label: string; value: SortType }[] = [
    { label: '編號', value: 'serialNo' },
    { label: '建立日期', value: 'createdAt' },
    { label: '上架日期', value: 'publishedAt' },
    { label: '預計下架日期', value: 'expectedOffShelfAt' },
    { label: '需求數量', value: 'amount' },
    { label: '剩餘需求', value: 'remaining' },
  ];

  // 關閉排序下拉選單
  @HostListener('document:click')
  closeSortDropdown() {
    this.isSortDropdownOpen = false;
  }

  // 開啟 / 關閉排序下拉選單
  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  // 取得目前排序名稱
  getSelectedSortLabel(): string {
    const found = this.sortOptions.find((opt) => opt.value === this.selectedSort);

    return found ? found.label : '建立日期';
  }

  // 選擇排序方式
  selectSortOption(value: SortType) {
    this.selectedSortChange.emit(value);
    this.isSortDropdownOpen = false;
  }

  // 切換排序方向
  toggleSortOrder() {
    this.sortAscending = !this.sortAscending;

    this.sortAscendingChange.emit(this.sortAscending);
  }
}
