import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DisasterDemandService } from '../../core/services/disaster-demand.service';
import { DisasterDemand,  DisasterStatus, DisplayStatus } from '../../models/agency/demand';

import { SupplyDeleteComponent } from '../modal/supply-delete/supply-delete.component';
import { PaginationComponent } from '../pagination/pagination.component';

import { VolunteerDemandService  } from '../../core/services/volunteer-demand.service';
import {  VolunteerDemand } from '../../models/agency/vdemand';

type SortType = 'createdAt' | 'amount' | 'remaining';

type VolunteerSortType = 'createdAt' | 'people';
type VolunteerStatus = '上架' | '隱藏' | '下架';
type VolunteerDisplayStatus =
  | '已上架'
  | '隱藏中'
  | '已下架';
@Component({
  selector: 'app-demand-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyDeleteComponent, PaginationComponent],
  templateUrl: './demand-list.component.html',
  styleUrl: './demand-list.component.scss',
})
export class DemandListComponent implements OnInit, AfterViewInit {
  demands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
  })[] = [];

  filteredDemands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
  })[] = [];

  pagedDemands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
  })[] = [];

  selectAll = false;

  // =========================
  // 搜尋
  // =========================

  searchTerm = '';

  // =========================
  // 分頁
  // =========================

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  // =========================
  // 保留列表位置
  // =========================

  private readonly scrollPositionKey = 'agency-disaster-workspace-scroll';

  private readonly pagePositionKey = 'agency-disaster-workspace-page';

  // =========================
  // 排序
  // =========================

  selectedSort: SortType = 'createdAt';
  sortAscending = true;
  isSortDropdownOpen = false;

  private userHasSorted = false;

  sortOptions: { label: string; value: SortType }[] = [
    { label: '發布時間', value: 'createdAt' },
    { label: '需求數量', value: 'amount' },
    { label: '剩餘需求', value: 'remaining' },
  ];
  // =========================
  // 刪除
  // =========================

  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  // =========================
  // 篩選
  // =========================

  showFilterModal = false;

  statusOptions: DisplayStatus[] = ['已上架', '隱藏中', '已下架'];

  priorityOptions: DisasterDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  categoryOptions: NonNullable<DisasterDemand['category']>[] = ['食物', '衣物', '醫療', '嬰幼兒', '生活用品', '其他'];

  messageOptions = ['已回覆', '未回覆'];

  selectedFilters = {
    status: [] as string[],
    priority: [] as string[],
    lowRemaining: false,
    category: [] as string[],
    messageStatus: [] as string[],
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private volunteerDemandService: VolunteerDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }

  // =========================
  // 初始化
  // =========================

  ngOnInit() {
    const savedPage = sessionStorage.getItem(this.pagePositionKey);

    if (savedPage) {
      const page = Number(savedPage);

      if (page >= 1) {
        this.currentPage = page;
      }
    }

    this.loadDemands();
    // 志工需求
  this.loadVolunteerDemands();
  }

  ngAfterViewInit() {
    const savedScroll = sessionStorage.getItem(this.scrollPositionKey);

    if (savedScroll) {
      const scrollY = Number(savedScroll);

      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }
  }

  // =========================
  // 新增
  // =========================

  goToAddDemand() {
    this.router.navigate(['/agency/supply-form']);
  }

  // =========================
  // 查看
  // =========================

  goToDetail(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/supply-detail', id], {
      queryParams: { number: id },
    });
  }

  // =========================
  // 編輯
  // =========================

  goToEdit(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/supply-edit', id]);
  }

  // =========================
  // 儲存列表位置
  // =========================

  saveListPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // =========================
  // 排序下拉選單
  // =========================

  @HostListener('document:click')
  closeSortDropdown() {
    this.isSortDropdownOpen = false;
  }

  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  getSelectedSortLabel(): string {
    const found = this.sortOptions.find((opt) => opt.value === this.selectedSort);

    return found ? found.label : '發布時間';
  }

  selectSortOption(value: SortType) {
    const scrollY = window.scrollY;

    this.selectedSort = value;

    this.userHasSorted = true;

    this.isSortDropdownOpen = false;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  toggleSortOrder() {
    const scrollY = window.scrollY;

    this.userHasSorted = true;

    this.sortAscending = !this.sortAscending;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  // =========================
  // 讀取需求
  // =========================

  loadDemands() {
    this.demands = this.disasterDemandService.getDemands().map((item) => {
      let currentStatus: DisplayStatus = '已上架';

      if (item.status === '上架') {
        currentStatus = '已上架';
      }

      if (item.status === '隱藏') {
        currentStatus = '隱藏中';
      }

      if (item.status === '下架') {
        currentStatus = '已下架';
      }

      return {
        ...item,

        selected: false,

        status: item.status,

        displayStatus: currentStatus,

        displayCreatedAt:
          item.status === '隱藏' ? '尚未發布' : item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布',

        remaining: item.remaining ?? item.amount ?? 0,

        category: item.category ?? '其他',
      };
    });

    this.applyFilters(false);
  }

  // =========================
  // 搜尋
  // =========================

  onSearch() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // =========================
  // 全選
  // =========================

  toggleAll() {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected() {
    return this.filteredDemands.some((item) => item.selected);
  }

  // =========================
  // 批次編輯
  // =========================

  editSelected() {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');
      return;
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    this.router.navigate(['/agency/supply-batch-edit']);
  }

  // =========================
  // 篩選 Modal
  // =========================

  openFilterModal() {
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  toggleFilter(key: 'status' | 'priority' | 'category' | 'messageStatus', value: string) {
    const index = this.selectedFilters[key].indexOf(value);

    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }
  }

  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }

  // =========================
  // 套用篩選
  // =========================

  applyFilters(resetPage: boolean = true) {
    this.filteredDemands = this.demands.filter((item) => {
      // 關鍵字
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim().toLowerCase();

        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;

        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      // 上架狀態
      if (this.selectedFilters.status.length > 0 && !this.selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      // 優先度
      if (this.selectedFilters.priority.length > 0 && !this.selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      // 剩餘數量
      if (this.selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      // 類別
      if (this.selectedFilters.category.length > 0 && (!item.category || !this.selectedFilters.category.includes(item.category))) {
        return false;
      }

      // 留言狀態
      if (this.selectedFilters.messageStatus.length > 0) {
        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = this.selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = this.selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        if (wantsNotReplied && !wantsReplied && hasMsg) {
          return false;
        }
      }

      return true;
    });

    if (resetPage) {
      this.currentPage = 1;
    }

    if (this.userHasSorted) {
      this.applySort();
    } else {
      this.updatePagination();
    }

    this.closeFilterModal();
  }

  // =========================
  // 排序
  // =========================

  applySort() {
    this.filteredDemands.sort((a, b) => {
      let result = 0;

      if (this.selectedSort === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();

        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();

        result = aTime - bTime;
      }

      if (this.selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (this.selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      return this.sortAscending ? result : -result;
    });

    this.updatePagination();
  }

  // =========================
  // 分頁
  // =========================

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredDemands.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.pageNumbers = Array.from(
      {
        length: this.totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.pagedDemands = this.filteredDemands.slice(startIndex, endIndex);

    this.selectAll = this.pagedDemands.length > 0 && this.pagedDemands.every((item) => item.selected);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;

      this.updatePagination();
    }
  }

  // =========================
  // 刪除
  // =========================

  openDeleteModal(id: number) {
    this.deleteIds = [id];

    this.deleteType = 'single';

    this.showDeleteModal = true;
  }

  openBatchDeleteModal() {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id !== undefined).map((item) => item.id as number);

    this.deleteType = 'batch';

    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  onDeleted() {
    this.showDeleteModal = false;

    this.deleteIds = [];

    this.selectAll = false;

    this.loadDemands();
  }

  // =========================
  // 修改狀態
  // =========================

  changeStatus(
    item: DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
      displayCreatedAt: string;
    }
  ) {
    let status: DisasterStatus;

    switch (item.displayStatus) {
      case '已上架':
        status = '上架';
        break;

      case '隱藏中':
        status = '隱藏';
        break;

      case '已下架':
        status = '下架';
        break;

      default:
        status = '上架';
    }

    item.status = status;

    if (status === '隱藏') {
      item.displayCreatedAt = '尚未發布';
    }

    if (status === '上架' || status === '下架') {
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布';
    }

    this.disasterDemandService.updateDemand(item);
  }
// ======================================================
// 志工需求資料
// ======================================================

volunteerDemands: (
  VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
)[] = [];

filteredVolunteerDemands: (
  VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
)[] = [];
showVolunteerDeleteModal = false;
selectedVolunteerIds: number[] = [];
selectedVolunteerId: number | null = null;
// 志工全選
volunteerSelectAll = false;
// 志工排序

// 志工篩選 Modal
showVolunteerFilterModal = false;
// 載入志工需求
loadVolunteerDemands(){
  this.volunteerDemands = this.volunteerDemandService.getDemands().map((item) => {
      let displayStatus: VolunteerDisplayStatus = '已上架';
        if (item.status === '上架') {
          displayStatus = '已上架';
        }
        if (item.status === '隱藏') {
          displayStatus = '隱藏中';
        }
        if (item.status === '下架') {
          displayStatus = '已下架';
        }
        return {
          ...item,
          selected: false,
          displayStatus,
          displayCreatedAt:
            item.status === '隱藏'
              ? '尚未發布'
              : item.createdAt
                ? new Date(item.createdAt)
                    .toLocaleDateString('zh-TW')
                : '尚未發布'
        };
      });
  // 跟物資需求一樣
  this.filteredVolunteerDemands = [
  ...this.volunteerDemands
];

this.applyVolunteerSort();

this.volunteerCurrentPage = 1;

this.updateVolunteerPagination();

}
// 志工全選
toggleVolunteerAll(): void {

  this.filteredVolunteerDemands.forEach(item => {
    item.selected = this.volunteerSelectAll;
  });

}

// 志工是否有選取
hasSelectedVolunteer(): boolean {
  return this.filteredVolunteerDemands
    .some((item) => item.selected);
}
// 志工單筆編輯
goToVolunteerEdit(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/volunteer-edit', id]);
  }

// 志工批次編輯
editSelectedVolunteer(): void {
  const selectedItems =
    this.filteredVolunteerDemands
      .filter((item) => item.selected);
  if (selectedItems.length === 0) {
    alert('請先選擇要修改的志工需求');
    return;
  }

  localStorage.setItem(
    'editVolunteerDemands',
    JSON.stringify(selectedItems)
  );
  this.saveListPosition();
  this.router.navigate([
    '/agency/volunteer-batch-edit'
  ]);
}

// 1. 開啟刪除 Modal（同時支援單筆與批次）
openVolunteerDeleteModal(id?: number): void {
  if (id !== undefined) {
    // 單筆刪除
    this.selectedVolunteerIds = [id];
  } else {
    // 批次刪除
    const selectedItems = this.filteredVolunteerDemands.filter(
      item => item.selected && item.id !== undefined
    );

    if (selectedItems.length === 0) {
      alert('請先選擇要刪除的志工需求');
      return;
    }

    this.selectedVolunteerIds = selectedItems.map(item => item.id!);
  }

  this.showVolunteerDeleteModal = true;
}

// 2. 關閉刪除 Modal
closeVolunteerDeleteModal(): void {
  this.showVolunteerDeleteModal = false;
  this.selectedVolunteerIds = [];
}

// 3. 確認執行刪除
confirmVolunteerDelete(): void {
  if (this.selectedVolunteerIds.length === 0) {
    this.closeVolunteerDeleteModal();
    return;
  }

  // 執行刪除 (若 deleteDemand 回傳 Observable，請記得 subscribe 或用 forkJoin)
  this.selectedVolunteerIds.forEach(id => {
    this.volunteerDemandService.deleteDemand(id);
  });

  // 狀態清理與重新載入
  this.showVolunteerDeleteModal = false;
  this.selectedVolunteerIds = [];
  this.volunteerSelectAll = false;
  this.loadVolunteerDemands();
}
// 志工排序下拉選單
volunteerSelectedSort: string = 'createdAt';

volunteerSortAscending: boolean = false;

volunteerSortDropdownOpen: boolean = false;

volunteerSortOptions = [
  {
    value: 'createdAt',
    label: '發布時間'
  },
  {
    value: 'people',
    label: '需求人數'
  },
];
toggleVolunteerSortDropdown(): void {
  this.volunteerSortDropdownOpen =
    !this.volunteerSortDropdownOpen;
}

// 志工排序名稱
getVolunteerSortLabel(): string {
  const found =
    this.volunteerSortOptions.find(
      (opt) =>
        opt.value ===
        this.volunteerSelectedSort
    );
  return found
    ? found.label
    : '發布時間';
}
// 志工選擇排序
toggleVolunteerSortOrder(): void {
  // 切換排序方向
  this.volunteerSortAscending =
    !this.volunteerSortAscending;

  // 重新排序
  this.applyVolunteerSort();
}
// 志工選擇排序
applyVolunteerSort(): void {

  this.filteredVolunteerDemands.sort((a, b) => {

    let result = 0;

    // =========================
    // 建立時間
    // =========================
    if (this.volunteerSelectedSort === 'createdAt') {

      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      result = aTime - bTime;
    }
    // =========================
    // 需求人數
    // =========================
    else if (this.volunteerSelectedSort === 'people') {

      result =
        Number(a.people ?? 0) -
        Number(b.people ?? 0);
    }
    // =========================
    // 排序方向
    // =========================
    return this.volunteerSortAscending
      ? result
      : -result;
  });

  this.updatePagination();
}
selectVolunteerSort(value: string): void {
  this.volunteerSelectedSort = value;

  this.volunteerSortDropdownOpen = false;

  this.applyVolunteerSort();
}
// 志工篩選 Modal
openVolunteerFilterModal(): void {
  this.showVolunteerFilterModal =
    true;
}
closeVolunteerFilterModal(): void {
  this.showVolunteerFilterModal =
    false;
}
// 志工狀態修改
changeVolunteerStatus(
  item: VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
): void {

  // 將顯示狀態轉換成資料實際狀態
  switch (item.displayStatus) {

    case '已上架':
      item.status = '上架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;

    case '隱藏中':
      item.status = '隱藏';

      item.displayCreatedAt = '尚未發布';

      break;

    case '已下架':
      item.status = '下架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;

    default:
      item.status = '上架';

      item.displayStatus = '已上架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;
  }

  // 如果你的 Service 有更新方法，這裡要同步更新資料
  // this.volunteerDemandService.updateDemand(item);
}
volunteerCurrentPage = 1;
volunteerPageSize = 10;
volunteerTotalPages = 1;
volunteerPageNumbers: number[] = [];

updateVolunteerPagination(): void {

  this.volunteerTotalPages = Math.ceil(
    this.volunteerDemands.length /
    this.volunteerPageSize
  );

  if (this.volunteerTotalPages < 1) {
    this.volunteerTotalPages = 1;
  }

  if (
    this.volunteerCurrentPage >
    this.volunteerTotalPages
  ) {
    this.volunteerCurrentPage =
      this.volunteerTotalPages;
  }

  const start =
    (this.volunteerCurrentPage - 1) *
    this.volunteerPageSize;

  const end =
    start + this.volunteerPageSize;

  // ★ 直接改目前顯示的資料
  this.filteredVolunteerDemands =
    this.volunteerDemands.slice(start, end);

  this.volunteerPageNumbers =
    Array.from(
      { length: this.volunteerTotalPages },
      (_, i) => i + 1
    );
}
goToVolunteerPage(page: number): void {

  this.volunteerCurrentPage = page;

  this.updateVolunteerPagination();
}
}
