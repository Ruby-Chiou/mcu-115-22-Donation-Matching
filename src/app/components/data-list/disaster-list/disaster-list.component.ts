import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand, DisasterStatus, DisplayStatus } from '../../../models/agency/demand';
import { SupplyDeleteComponent } from '../../modal/supply-delete/supply-delete.component';
import { PaginationComponent } from '../../pagination/pagination.component';
import { SupplySearchBarComponent } from '../../search-bar/supply-search-bar/supply-search-bar.component';
import { SupplySortBarComponent, SortType } from '../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { SupplyFilterComponent, SupplyFilterState } from '../../filter/supply-filter/supply-filter.component';
import { SupplyOffShelfComponent } from '../../modal/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../modal/supply-on-shelf/supply-on-shelf.component';

@Component({
  selector: 'app-disaster-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SupplyDeleteComponent,
    SupplyOffShelfComponent,
    SupplyOnShelfComponent,
    PaginationComponent,
    SupplySearchBarComponent,
    SupplySortBarComponent,
    SupplyFilterComponent,
  ],
  templateUrl: './disaster-list.component.html',
  styleUrls: ['./disaster-list-A.component.scss'],
})
export class DisasterListComponent implements OnInit, AfterViewInit {
  demands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  filteredDemands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  pagedDemands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  })[] = [];

  selectAll = false;
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
  selectedSort: SortType = 'serialNo';
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

  pendingOffShelfItem?: DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
    displayCreatedAt: string;
    displayPublishedAt: string;
    displayOffShelfAt: string;
  };

  // 篩選選項
  statusOptions: DisplayStatus[] = ['已上架', '隱藏中', '已下架'];
  priorityOptions: DisasterDemand['priority'][] = ['普通', '緊急', '非常緊急'];
  categoryOptions: NonNullable<DisasterDemand['category']>[] = [
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

  selectedFilters: SupplyFilterState = {
    status: [],
    priority: [],
    lowRemaining: false,
    category: [],
    messageStatus: [],
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
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
    this.router.navigate(['/agency/supply-form']);
  }

  // 查看
  goToDetail(serialNo: number) {
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/supply-detail', serialNo], {
      queryParams: {
        number: serialNo,
      },
    });
  }

  // 編輯
  goToEdit(serialNo: number) {
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/supply-edit', serialNo]);
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

  // 讀取需求
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
        displayCreatedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
        displayPublishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',
        displayOffShelfAt: item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
        remaining: item.remaining ?? item.amount ?? 0,
        category: item.category ?? '其他',
      };
    });

    this.applyFilters(false);
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

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    sessionStorage.setItem('restore-agency-disaster-list', 'true');

    this.router.navigate(['/agency/supply-batch-edit']);
  }

  // 篩選
  onFilterApply(filters: SupplyFilterState) {
    this.selectedFilters = filters;

    this.applyFilters();
  }

  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
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
  }

  // 排序
  applySort() {
    this.filteredDemands.sort((a, b) => {
      let result = 0;

      // 編號
      if (this.selectedSort === 'serialNo') {
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
      if (this.selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      // 剩餘需求
      if (this.selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
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
  openDeleteModal(serialNo: number) {
    this.deleteIds = [serialNo];

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
    item: DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
      displayCreatedAt: string;
      displayPublishedAt: string;
      displayOffShelfAt: string;
    },
    event: Event
  ) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as DisplayStatus;

    // 選擇「已下架」
    if (newStatus === '已下架') {
      // 取得目前真正儲存的原始狀態
      const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

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

      // 暫存等待確認的項目
      this.pendingOffShelfItem = item;

      // 開啟下架確認視窗
      this.showOffShelfWarning = true;

      return;
    }

    // 選擇「已上架」或「隱藏中」
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    // 已下架 → 禁止重新上架
    if (newStatus === '已上架' && originalItem?.status === '下架') {
      // 保持列表顯示「已下架」
      item.displayStatus = '已下架';

      // 將 select 強制恢復成「已下架」
      setTimeout(() => {
        select.value = '已下架';
      });

      // 顯示無法重新上架提示
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

    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

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

    // 保留原本的上架日期
    if (originalItem?.publishedAt) {
      item.publishedAt = originalItem.publishedAt;

      item.displayPublishedAt = new Date(item.publishedAt).toLocaleDateString('zh-TW');
    }

    // 儲存
    this.disasterDemandService.updateDemand(item);

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
    item.publishedAt = undefined;

    item.expectedOffShelfAt = undefined;

    item.displayPublishedAt = '尚未上架';

    item.displayOffShelfAt = '—';

    // 建立日期永遠保留
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 儲存
    this.disasterDemandService.updateDemand(item);

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
    item: DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
      displayCreatedAt: string;
      displayPublishedAt: string;
      displayOffShelfAt: string;
    }
  ) {
    // 取得原本儲存的資料
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const originalStatus = originalItem?.status;

    let status: DisasterStatus;

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
    this.disasterDemandService.updateDemand(item);
  }

  // 預計下架日期
  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
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
