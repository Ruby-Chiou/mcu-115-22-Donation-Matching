import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand, VolunteerStatus, DisplayVolunteerStatus } from '../../../../models/agency/volunteer-demand';

import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { VolunteerDeleteComponent } from '../../../modal/delete/volunteer-delete/volunteer-delete.component';
import { PaginationComponent } from '../../../pagination/pagination.component';

import { VolunteerSearchBarComponent } from '../../../search-bar/volunteer-search-bar/volunteer-search-bar.component';
import { VolunteerFilterComponent, VolunteerFilterState } from '../../../filter/volunteer-filter/volunteer-filter.component';
import { VolunteerSortBarComponent, SortType } from '../../../sort-bar/volunteer-sort-bar/volunteer-sort-bar.component';
import { VolunteerOnShelfComponent } from '../../../modal/shelf/volunteer-on-shelf/volunteer-on-shelf.component';
import { VolunteerOffShelfComponent } from '../../../modal/shelf/volunteer-off-shelf/volunteer-off-shelf.component';

@Component({
  selector: 'app-volunteer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PaginationComponent,
    VolunteerDeleteComponent,
    VolunteerSearchBarComponent,
    VolunteerSortBarComponent,
    VolunteerFilterComponent,
    VolunteerOffShelfComponent,
    VolunteerOnShelfComponent,
    SupplyLoadingComponent,
  ],
  templateUrl: './volunteer-list.component.html',
  styleUrl: './volunteer-list.component.scss',
})
export class VolunteerListComponent {
  demands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  filteredDemands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];
  pagedDemands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  selectAll = false;
  isLoading = false;
  isRestoringScroll = false;
  // 搜尋
  searchTerm = '';
  // 分頁
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  // 保留列表位置
  private readonly scrollPositionKey = 'agency-disaster-workspace-scroll';
  private readonly pagePositionKey = 'agency-disaster-workspace-page';

  // 排序
  selectedSort: SortType = 'id';
  sortAscending = true;
  private userHasSorted = true;

  // 刪除
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  // 手動下架提示
  showOffShelfWarning = false;

  // 已下架無法重新上架提示
  showOnShelfWarning = false;

  pendingOffShelfItem?: VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  };
  // 篩選選項
  statusOptions: DisplayVolunteerStatus[] = ['已上架', '隱藏中', '已下架'];
  priorityOptions: VolunteerDemand['priority'][] = ['普通', '緊急', '非常緊急'];
  typeOptions: NonNullable<VolunteerDemand['type']>[] = ['物資搬運', '物資整理', '環境清潔', '醫療照護', '其他'];
  messageOptions = ['已回覆', '未回覆'];

  selectedFilters: VolunteerFilterState = {
    status: [],
    priority: [],
    lowRemaining: false,
    type: [],
    messageStatus: [],
  };

  constructor(
    private VolunteerDemandService: VolunteerDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }
  // 初始化
  ngOnInit() {
    const restoreListPosition = sessionStorage.getItem('restore-agency-disaster-list');
    if (restoreListPosition === 'true') {
      const savedPage = sessionStorage.getItem(this.pagePositionKey);
      if (savedPage) {
        const page = Number(savedPage);
        if (page >= 1) {
          this.currentPage = page;
        }
      }
      // 只使用一次，避免重新進入列表又恢復舊頁數
      sessionStorage.removeItem('restore-agency-disaster-list');
    } else {
      // 第一次進入列表 → 永遠從第 1 頁開始
      this.currentPage = 1;
      // 清掉舊的位置資料
      sessionStorage.removeItem(this.pagePositionKey);
      sessionStorage.removeItem(this.scrollPositionKey);
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
    this.router.navigate(['/agency/volunteer-form']);
  }
  // 查看
  goToDetail(id: number) {
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/volunteer-detail', id], {
      queryParams: {
        number: id,
      },
    });
  }
  // 編輯
  goToEdit(id: number) {
    this.saveListPosition();
    this.router.navigate(['/agency/volunteer-edit', id]);
  }
  // 儲存列表位置
  saveListPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition() {
    this.saveListPosition();
  }
  // 讀取需求
  loadDemands() {
    this.isLoading = true;

    const displayStatus: Record<VolunteerStatus, DisplayVolunteerStatus> = {
      上架: '已上架',
      隱藏: '隱藏中',
      下架: '已下架',
    };

    setTimeout(() => {
      this.demands = this.VolunteerDemandService.getDemands().map((item) => {
        return {
          ...item,

          selected: false,

          // 這裡加上 as VolunteerStatus
          displayStatus: displayStatus[item.status as VolunteerStatus],

          displayCreatedAt:
            item.status === '隱藏' ? '尚未發布' : item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布',

          displayPublishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',

          displayOffShelfAt: item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',

          category: item.type ?? '其他',
        };
      });

      this.applyFilters(false);

      this.isLoading = false;
    }, 500);
  }
  // 搜尋
  onSearchChange(value: string) {
    this.searchTerm = value;
    this.applyFilters();
  }
  // 排序
  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }) {
    const scrollY = window.scrollY;
    this.selectedSort = event.selectedSort;
    this.sortAscending = event.sortAscending;
    this.userHasSorted = true;
    this.applySort();
    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
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
    localStorage.setItem('editVolunteerDemands', JSON.stringify(selectedItems));
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/volunteer-batch-edit']);
  }

  // 篩選
  onFilterApply(filters: VolunteerFilterState) {
    this.selectedFilters = filters;

    this.applyFilters();
  }
  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      type: [],
      messageStatus: [],
    };
    this.applyFilters();
  }
  // 套用篩選
  applyFilters(resetPage: boolean = true) {
    this.filteredDemands = this.demands.filter((item) => {
      // 關鍵字
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim().toLowerCase();
        const matchItem = item.type ? item.type.toLowerCase().includes(term) : false;
        if (!matchItem) {
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
      // 類別
      if (this.selectedFilters.type.length > 0 && (!item.type || !this.selectedFilters.type.includes(item.type))) {
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
  }

  // 排序
  private getUnpublishAt(demand: VolunteerDemand): string {
    if (demand.status === '隱藏' || !demand.createdAt) {
      return '尚未發布';
    }
    const unpublishAt = new Date(demand.createdAt);
    const daysToAdd = {
      普通: 14,
      緊急: 7,
      非常緊急: 3,
    }[demand.priority];

    if (Number.isNaN(unpublishAt.getTime())) {
      return '尚未發布';
    }
    unpublishAt.setDate(unpublishAt.getDate() + daysToAdd);
    return unpublishAt.toLocaleDateString('zh-TW');
  }

  private getCreatedAtTime(demand: VolunteerDemand): number {
    if (demand.status === '隱藏' || !demand.createdAt) {
      return Number.POSITIVE_INFINITY;
    }
    const timestamp = new Date(demand.createdAt).getTime();
    return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
  }

  // 排序
  applySort() {
    this.filteredDemands.sort((a, b) => {
      let result = 0;

      // 編號
      if (this.selectedSort === 'id') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      // 建立日期
      if (this.selectedSort === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;

        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        result = aTime - bTime;
      }

      // 上架日期
      if (this.selectedSort === 'publishedAt') {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;

        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

        result = aTime - bTime;
      }

      // 預計下架日期
      if (this.selectedSort === 'expectedOffShelfAt') {
        const aTime = a.expectedOffShelfAt ? new Date(a.expectedOffShelfAt).getTime() : 0;

        const bTime = b.expectedOffShelfAt ? new Date(b.expectedOffShelfAt).getTime() : 0;

        result = aTime - bTime;
      }

      // 需求數量
      if (this.selectedSort === 'people') {
        result = Number(a.people ?? 0) - Number(b.people ?? 0);
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
    this.deleteIds = this.filteredDemands
      .filter((item) => item.selected && item.serialNo !== undefined)
      .map((item) => item.serialNo as number);
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
    item: VolunteerDemand & {
      selected: boolean;
      displayStatus: DisplayVolunteerStatus;
      displayCreatedAt: string;
      displayPublishedAt: string;
      displayOffShelfAt: string;
    },
    event: Event
  ) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as DisplayVolunteerStatus;

    // 選擇「已下架」
    if (newStatus === '已下架') {
      const originalItem = this.VolunteerDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
      // 暫存原本的顯示狀態
      if (originalItem?.status === '上架') {
        item.displayStatus = '已上架';
      } else if (originalItem?.status === '隱藏') {
        item.displayStatus = '隱藏中';
      } else if (originalItem?.status === '下架') {
        item.displayStatus = '已下架';
      }
      setTimeout(() => {
        select.value = item.displayStatus;
      });
      this.pendingOffShelfItem = item;
      this.showOffShelfWarning = true;
      return;
    }
    // 選擇「已上架」或「隱藏中」
    const originalItem = this.VolunteerDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
    // 已下架 → 禁止重新上架
    if (newStatus === '已上架' && originalItem?.status === '下架') {
      item.displayStatus = '已下架';
      setTimeout(() => {
        select.value = '已下架';
      });
      this.showOnShelfWarning = true;
      return;
    }
    // 正常變更狀態
    item.displayStatus = newStatus;
    this.applyStatusChange(item);
  }
  // 確認手動下架
  confirmManualOffShelf() {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = this.pendingOffShelfItem;

    const originalItem = this.VolunteerDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const now = new Date();

    // 狀態改成下架
    item.status = '下架';

    // 記錄實際手動下架時間
    item.expectedOffShelfAt = now.toISOString();

    // 顯示狀態
    item.displayStatus = '已下架';

    // 顯示下架日期
    item.displayOffShelfAt = now.toLocaleDateString('zh-TW');

    // 建立日期永遠保留
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 保留原本的建立日期
    // 建立日期已在前面處理

    // 儲存
    this.VolunteerDemandService.updateDemand(item);

    // 關閉提示框
    this.closeOffShelfWarning();
  }

  // 取消手動下架
  cancelManualOffShelf() {
    this.closeOffShelfWarning();
  }

  // 選擇「隱藏」
  hideInsteadOfOffShelf() {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = this.pendingOffShelfItem;

    // 改成隱藏
    item.status = '隱藏';

    item.displayStatus = '隱藏中';

    // 隱藏後視為尚未上架
    item.expectedOffShelfAt = undefined;

    item.displayPublishedAt = '尚未上架';

    item.displayOffShelfAt = '—';

    // 建立日期永遠保留
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 儲存
    this.VolunteerDemandService.updateDemand(item);

    // 關閉提示框
    this.closeOffShelfWarning();
  }

  // 關閉手動下架提示
  closeOffShelfWarning() {
    this.showOffShelfWarning = false;

    this.pendingOffShelfItem = undefined;
  }

  // 關閉無法重新上架提示
  closeOnShelfWarning() {
    this.showOnShelfWarning = false;
  }
  // 實際處理狀態變更
  private applyStatusChange(
    item: VolunteerDemand & {
      selected: boolean;
      displayStatus: DisplayVolunteerStatus;
      displayCreatedAt: string;
      displayPublishedAt: string;
      displayOffShelfAt: string;
    }
  ) {
    // 取得原本儲存的資料
    const originalItem = this.VolunteerDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const originalStatus = originalItem?.status;

    let status: VolunteerStatus;

    switch (item.displayStatus) {
      case '已上架':
        status = '上架';
        break;

      case '隱藏中':
        status = '隱藏';
        break;

      default:
        status = '上架';
    }

    const now = new Date();

    // 上架
    if (status === '上架') {
      // 手動下架後禁止重新上架
      if (originalStatus === '下架') {
        item.displayStatus = '已下架';

        this.showOnShelfWarning = true;

        return;
      }

      // 原本不是上架
      // → 現在重新上架
      if (originalStatus !== '上架') {
        item.publishedAt = now.toISOString();

        // 建立日期只在建立時記錄
        if (!item.createdAt) {
          item.createdAt = now.toISOString();
        }
      }

      // 原本就是上架
      // → 保留原本上架日期
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

    // 隱藏
    else if (status === '隱藏') {
      item.status = '隱藏';

      // 隱藏後視為尚未上架
      item.publishedAt = undefined;

      item.expectedOffShelfAt = undefined;

      item.displayStatus = '隱藏中';

      item.displayPublishedAt = '尚未上架';

      item.displayOffShelfAt = '—';
    }

    // 建立日期永遠保留
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 儲存
    this.VolunteerDemandService.updateDemand(item);
  }

  // 預計下架日期
  calculateExpectedOffShelfDate(publishedDate: Date, priority: VolunteerDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 7);
        break;
    }

    return offShelfDate.toISOString();
  }
}
