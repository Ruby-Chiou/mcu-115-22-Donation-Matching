import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SortType = 'serialNo' | 'createdAt' | 'publishedAt' | 'expectedOffShelfAt' | 'amount' | 'remaining';

@Component({
  selector: 'app-supply-sort-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-sort-bar.component.html',
  styleUrls: ['./supply-sort-bar.component.scss'],
})
export class SupplySortBarComponent {
  @Output() sortChange = new EventEmitter<{
    selectedSort: SortType;
    sortAscending: boolean;
  }>();

  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  isSortDropdownOpen = false;

  sortOptions: { label: string; value: SortType }[] = [
    { label: '編號', value: 'serialNo' },
    { label: '建立日期', value: 'createdAt' },
    { label: '上架日期', value: 'publishedAt' },
    { label: '預計下架日期', value: 'expectedOffShelfAt' },
    { label: '需求數量', value: 'amount' },
    { label: '剩餘需求', value: 'remaining' },
  ];

  @HostListener('document:click')
  closeSortDropdown() {
    this.isSortDropdownOpen = false;
  }

  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  getSelectedSortLabel(): string {
    const found = this.sortOptions.find((opt) => opt.value === this.selectedSort);

    return found ? found.label : '建立日期';
  }

  selectSortOption(value: SortType) {
    this.selectedSort = value;
    this.isSortDropdownOpen = false;

    this.emitSortChange();
  }

  toggleSortOrder() {
    this.sortAscending = !this.sortAscending;

    this.emitSortChange();
  }

  private emitSortChange() {
    this.sortChange.emit({
      selectedSort: this.selectedSort,
      sortAscending: this.sortAscending,
    });
  }
}
