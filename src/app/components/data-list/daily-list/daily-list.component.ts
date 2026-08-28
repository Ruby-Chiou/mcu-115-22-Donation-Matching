import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand, DailyStatus, DailyDisplayStatus } from '../../../models/agency/daily-demand';

import { SupplyDeleteComponent } from '../../modal/supply-delete/supply-delete.component';
import { PaginationComponent } from '../../pagination/pagination.component';

type SortType = 'createdAt' | 'publishedAt' | 'expectedOffShelfAt' | 'amount' | 'remaining';
type ReceiveMethod = '寄送' | '面交';

@Component({
  selector: 'app-daily-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyDeleteComponent, PaginationComponent],
  templateUrl: './daily-list.component.html',
  styleUrls: ['./daily-list-A.component.scss', './daily-list-B.component.scss', './daily-list-C.component.scss'],
})
export class DailyListComponent implements OnInit, AfterViewInit {
  demands: (DailyDemand & {
    selected: boolean;
    displayStatus: DailyDisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  filteredDemands: (DailyDemand & {
    selected: boolean;
    displayStatus: DailyDisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  pagedDemands: (DailyDemand & {
    selected: boolean;
    displayStatus: DailyDisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  selectAll = false;

  // 搜尋
  searchTerm = '';

  // 分頁
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  // 保留列表位置
  private readonly scrollPositionKey = 'agency-daily-workspace-scroll';
  private readonly pagePositionKey = 'agency-daily-workspace-page';

  // 排序
  selectedSort: SortType = 'createdAt';
  sortAscending = true;
  isSortDropdownOpen = false;

  private userHasSorted = false;

  sortOptions: { label: string; value: SortType }[] = [
    { label: '建立日期', value: 'createdAt' },
    { label: '上架日期', value: 'publishedAt' },
    { label: '預計下架日期', value: 'expectedOffShelfAt' },
    { label: '需求數量', value: 'amount' },
    { label: '剩餘需求', value: 'remaining' },
  ];

  // 刪除
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  // 篩選
  showFilterModal = false;

  statusOptions: DailyDisplayStatus[] = ['已上架', '隱藏中', '已下架'];

  priorityOptions: DailyDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  categoryOptions: NonNullable<DailyDemand['category']>[] = [
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

  messageOptions = ['已回覆', '未回覆'];
  receiveMethodOptions: ReceiveMethod[] = ['寄送', '面交'];

  selectedFilters = {
    status: [] as string[],
    priority: [] as string[],
    receiveMethod: [] as ReceiveMethod[],
    lowRemaining: false,
    category: [] as string[],
    messageStatus: [] as string[],
  };

  constructor(
    private dailyDemandService: DailyDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }

  // 初始化
  ngOnInit() {
    const savedPage = sessionStorage.getItem(this.pagePositionKey);

    if (savedPage) {
      const page = Number(savedPage);

      if (page >= 1) {
        this.currentPage = page;
      }
    }

    this.loadDemands();
  }

  ngAfterViewInit() {
    const savedScroll = sessionStorage.getItem(this.scrollPositionKey);

    if (!savedScroll) {
      return;
    }

    const scrollY = Number(savedScroll);

    window.scrollTo({
      top: scrollY,
      left: 0,
      behavior: 'instant',
    });

    requestAnimationFrame(() => {
      if (window.scrollY !== scrollY) {
        window.scrollTo({
          top: scrollY,
          left: 0,
          behavior: 'instant',
        });
      }
    });
  }

  // 新增
  goToAddDemand() {
    this.router.navigate(['/agency/daily-form']);
  }

  //
  goToDetail(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/daily-detail', id], {
      queryParams: { number: id },
    });
  }

  // 編輯
  goToEdit(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/daily-edit', id]);
  }

  // 儲存列表位置
  saveListPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // 排序下拉選單
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

  // 讀取需求
  loadDemands() {
    this.demands = this.dailyDemandService.getDemands().map((item) => {
      let currentStatus: DailyDisplayStatus = '已上架';

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

        // 建立日期
        displayCreatedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立',

        // 上架日期
        displayPublishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',

        // 預計下架日期
        displayOffShelfAt: item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',

        remaining: item.remaining ?? item.amount ?? 0,

        category: item.category ?? '其他',
      };
    });

    this.applyFilters(false);
  }

  // 搜尋
  onSearch() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // 全選
  toggleAll() {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected() {
    return this.filteredDemands.some((item) => item.selected);
  }

  // 批次編輯
  editSelected() {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');
      return;
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    this.router.navigate(['/agency/daily-batch-edit']);
  }

  // 篩選 Modal
  openFilterModal() {
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  toggleFilter(key: 'status' | 'priority' | 'receiveMethod' | 'category' | 'messageStatus', value: string) {
    const filters = this.selectedFilters[key] as string[];

    const index = filters.indexOf(value);

    if (index > -1) {
      filters.splice(index, 1);
    } else {
      filters.push(value);
    }
  }

  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      receiveMethod: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }

  // 套用篩選
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

      // 接收方式
      if (this.selectedFilters.receiveMethod.length > 0) {
        const selectedMethods = this.selectedFilters.receiveMethod;

        const matchReceiveMethod = selectedMethods.some((method) => {
          return item.receiveMethod?.[method] === true;
        });

        if (!matchReceiveMethod) {
          return false;
        }
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

  // 排序
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
      if (this.selectedSort === 'publishedAt') {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;

        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

        result = aTime - bTime;
      }

      if (this.selectedSort === 'expectedOffShelfAt') {
        const aTime = a.expectedOffShelfAt ? new Date(a.expectedOffShelfAt).getTime() : 0;

        const bTime = b.expectedOffShelfAt ? new Date(b.expectedOffShelfAt).getTime() : 0;

        result = aTime - bTime;
      }

      return this.sortAscending ? result : -result;
    });

    this.updatePagination();
  }

  // 分頁
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
  // 刪除
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

  // 修改狀態
  changeStatus(
    item: DailyDemand & {
      selected: boolean;
      displayStatus: DailyDisplayStatus;
      displayCreatedAt: string;
      displayPublishedAt: string;
      displayOffShelfAt: string;
    }
  ) {
    // 先取得原本儲存的資料
    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.id === item.id);

    const originalStatus = originalItem?.status;

    let status: DailyStatus;

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

    const now = new Date();

    // =========================
    // 上架
    // =========================
    if (status === '上架') {
      // 原本不是上架 → 現在重新上架
      if (originalStatus !== '上架') {
        item.publishedAt = now.toISOString();

        // 建立日期只在建立時記錄
        if (!item.createdAt) {
          item.createdAt = now.toISOString();
        }
      }

      // 原本就是上架 → 保留原本上架日期
      else if (originalItem?.publishedAt) {
        item.publishedAt = originalItem.publishedAt;
      }

      // 重新計算預計下架日期
      if (item.publishedAt) {
        item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      }

      item.status = '上架';
      item.displayStatus = '已上架';

      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';

      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
    }

    // =========================
    // 隱藏
    // =========================
    else if (status === '隱藏') {
      item.status = '隱藏';

      // 隱藏後視為尚未上架
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;

      item.displayStatus = '隱藏中';

      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
    }

    // =========================
    // 下架
    // =========================
    else if (status === '下架') {
      item.status = '下架';

      // 已下架時間
      item.expectedOffShelfAt = now.toISOString();

      item.displayStatus = '已下架';

      item.displayOffShelfAt = new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW');
    }

    // 建立日期永遠保留
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 儲存
    this.dailyDemandService.updateDemand(item);
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 60);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;
    }

    return offShelfDate.toISOString();
  }
}
