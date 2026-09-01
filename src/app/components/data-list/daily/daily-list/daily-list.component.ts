import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DailyDemandService } from '../../../../core/services/daily-demand.service';
import { DailyDemand, DailyDisplayStatus } from '../../../../models/agency/daily-demand';
import { SupplyDeleteComponent } from '../../../modal/supply-delete/supply-delete.component';
import { SupplyOffShelfComponent } from '../../../modal/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/supply-on-shelf/supply-on-shelf.component';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { DailySearchBarComponent } from '../../../search-bar/daily-search-bar/daily-search-bar.component';
import { DailySortBarComponent, SortType } from '../../../sort-bar/daily-sort-bar/daily-sort-bar.component';
import { DailyFilterComponent } from '../../../filter/daily-filter/daily-filter.component';

type ReceiveMethod = '寄送' | '面交';

// 篩選條件
type DailyFilterState = {
  status: string[];
  priority: string[];
  receiveMethod: ReceiveMethod[];
  lowRemaining: boolean;
  category: string[];
  messageStatus: string[];
};

// 列表資料型別
type DailyListItem = DailyDemand & {
  selected: boolean;
  displayStatus: DailyDisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

@Component({
  selector: 'app-daily-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SupplyDeleteComponent,
    SupplyOffShelfComponent,
    SupplyOnShelfComponent,
    PaginationComponent,
    DailySearchBarComponent,
    DailySortBarComponent,
    DailyFilterComponent,
  ],
  templateUrl: './daily-list.component.html',
  styleUrls: ['./daily-list-A.component.scss', './daily-list-B.component.scss'],
})
export class DailyListComponent implements OnInit, AfterViewInit {
  // 資料
  demands: DailyListItem[] = [];
  filteredDemands: DailyListItem[] = [];
  pagedDemands: DailyListItem[] = [];
  selectAll = false;
  isLoading = false;

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
  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  private userHasSorted = false;

  // 刪除
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  // 篩選 Modal
  showFilterModal = false;

  // 下架 / 上架提示 Modal
  showOffShelfWarning = false;

  // 已下架無法重新上架提示
  showOnShelfWarning = false;

  // 暫存等待確認下架的需求
  pendingOffShelfItem?: DailyListItem;

  // 篩選選項
  statusOptions: DailyDisplayStatus[] = ['已上架', '隱藏中', '已下架'];

  priorityOptions: DailyDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  receiveMethodOptions: ReceiveMethod[] = ['寄送', '面交'];

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

  messageOptions: string[] = ['已回覆', '未回覆'];

  // 目前選擇的篩選條件
  selectedFilters: DailyFilterState = {
    status: [],
    priority: [],
    receiveMethod: [],
    lowRemaining: false,
    category: [],
    messageStatus: [],
  };

  constructor(
    private dailyDemandService: DailyDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }

  // 初始化
  ngOnInit(): void {
    const savedPage = sessionStorage.getItem(this.pagePositionKey);

    if (savedPage) {
      const page = Number(savedPage);

      if (page >= 1) {
        this.currentPage = page;
      }
    }

    this.loadDemands();
  }

  // 初始化後恢復捲動位置
  ngAfterViewInit(): void {
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
  goToAddDemand(): void {
    this.router.navigate(['/agency/daily-form']);
  }

  // 查看詳細資料
  goToDetail(serialNo: number): void {
    this.saveListPosition();

    this.router.navigate(['/agency/daily-detail', serialNo], {
      queryParams: {
        number: serialNo,
      },
    });
  }

  // 編輯
  goToEdit(serialNo: number): void {
    this.saveListPosition();
    this.router.navigate(['/agency/daily-edit', serialNo]);
  }

  // 儲存列表位置
  saveListPosition(): void {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // 離開頁面
  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // 排序：變更排序欄位
  onSortChange(value: SortType): void {
    const scrollY = window.scrollY;

    this.selectedSort = value;
    this.userHasSorted = true;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  // 排序：變更升冪 / 降冪
  onSortOrderChange(ascending: boolean): void {
    const scrollY = window.scrollY;

    this.userHasSorted = true;
    this.sortAscending = ascending;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  // 讀取需求
  loadDemands(): void {
    this.isLoading = true;

    // 先讓 Loading 畫面確實顯示
    setTimeout(() => {
      try {
        const data = this.dailyDemandService.getDemands();

        this.demands = data.map((item) => {
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

            displayCreatedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立',

            displayPublishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',

            displayOffShelfAt: item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',

            remaining: item.remaining ?? item.amount ?? 0,

            category: item.category ?? '其他',
          };
        });

        this.applyFilters(false);
      } catch (error) {
        console.error('日常需求資料載入失敗：', error);

        this.demands = [];
        this.filteredDemands = [];
        this.pagedDemands = [];
      } finally {
        this.isLoading = false;
      }
    }, 800);
  }

  // 搜尋
  onSearch(): void {
    this.applyFilters();
  }

  // 清除搜尋
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // 開啟篩選 Modal
  openFilterModal(): void {
    this.showFilterModal = true;
  }

  // 關閉篩選 Modal
  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  // 重置篩選
  resetFilters(): void {
    this.selectedFilters = {
      status: [],
      priority: [],
      receiveMethod: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };

    this.applyFilters();
    this.showFilterModal = false;
  }

  // 確定篩選
  applyFilterFromModal(): void {
    this.applyFilters();
    this.showFilterModal = false;
  }

  // 套用篩選
  applyFilters(resetPage: boolean = true): void {
    this.filteredDemands = this.demands.filter((item) => {
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

    // 套用篩選後回第一頁
    if (resetPage) {
      this.currentPage = 1;
    }

    // 如果使用者已經手動排序
    if (this.userHasSorted) {
      this.applySort();
    } else {
      this.updatePagination();
    }
  }

  // 排序
  applySort(): void {
    this.filteredDemands.sort((a, b) => {
      let result = 0;

      if (this.selectedSort === 'serialNo') {
        result = a.serialNo - b.serialNo;
      }

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
  updatePagination(): void {
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

  // 切換頁面
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // 全選
  toggleAll(): void {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  // 是否有選取項目
  hasSelected(): boolean {
    return this.filteredDemands.some((item) => item.selected);
  }

  // 批次編輯
  editSelected(): void {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');
      return;
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    this.router.navigate(['/agency/daily-batch-edit']);
  }

  // 單筆刪除
  openDeleteModal(serialNo: number): void {
    this.deleteIds = [serialNo];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  // 批次刪除
  openBatchDeleteModal(): void {
    this.deleteIds = this.filteredDemands
      .filter((item) => item.selected && item.serialNo !== undefined)
      .map((item) => item.serialNo as number);

    if (this.deleteIds.length === 0) {
      alert('請先選擇要刪除的需求');
      return;
    }

    this.deleteType = 'batch';
    this.showDeleteModal = true;
  }

  // 關閉刪除 Modal
  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  // 刪除完成
  onDeleted(): void {
    this.showDeleteModal = false;
    this.deleteIds = [];
    this.selectAll = false;
    this.loadDemands();
  }

  // 修改狀態
  changeStatus(item: DailyListItem, newStatus: DailyDisplayStatus): void {
    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
    const originalStatus = originalItem?.status;

    // 1. 已下架嘗試重新上架 -> 保持「已下架」，跳出無法重新上架提示
    if (newStatus === '已上架') {
      if (originalStatus === '下架') {
        item.status = '下架';
        item.displayStatus = '已下架';

        // 強制重刷陣列中的物件，讓 Angular 偵測到變更並還原選單顯示
        this.refreshItemReference(item);

        this.showOnShelfWarning = true;
        return;
      }

      // 非下架狀態正常上架
      const now = new Date();
      item.publishedAt = now.toISOString();

      if (!item.createdAt) {
        item.createdAt = now.toISOString();
      }

      item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      item.status = '上架';
      item.displayStatus = '已上架';

      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';
      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);
      return;
    }

    // 2. 嘗試改為「已下架」 -> 保持原顯示狀態，跳出確認視窗
    if (newStatus === '已下架') {
      if (originalStatus === '下架') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return;
      }

      // 保持目前的顯示狀態不變，等待使用者於 Modal 點擊確認
      this.pendingOffShelfItem = item;

      // 還原選單顯示為點擊前的狀態（否則選單會卡在已下架）
      this.refreshItemReference(item);

      this.showOffShelfWarning = true;
      return;
    }

    // 3. 隱藏中
    if (newStatus === '隱藏中') {
      if (originalStatus === '下架') {
        // 已下架不能改成隱藏中，保持已下架
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return;
      }

      item.status = '隱藏';
      item.displayStatus = '隱藏中';
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;

      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);
      return;
    }
  }

  // 輔助函式：同步更新主資料與分頁陣列中的參考，觸發 DOM 重新繪製
  private refreshItemReference(item: DailyListItem): void {
    const demandIndex = this.demands.findIndex((d) => d.serialNo === item.serialNo);
    if (demandIndex !== -1) {
      this.demands[demandIndex] = { ...item };
    }

    const filteredIndex = this.filteredDemands.findIndex((d) => d.serialNo === item.serialNo);
    if (filteredIndex !== -1) {
      this.filteredDemands[filteredIndex] = { ...item };
    }

    const pagedIndex = this.pagedDemands.findIndex((d) => d.serialNo === item.serialNo);
    if (pagedIndex !== -1) {
      this.pagedDemands[pagedIndex] = { ...item };
    }
  }

  // 計算預計下架日期
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

  // 確認手動下架
  confirmManualOffShelf(): void {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = { ...this.pendingOffShelfItem };

    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const now = new Date();

    // 確認後才真正變成已下架
    item.status = '下架';
    item.displayStatus = '已下架';

    // 記錄實際下架時間
    item.expectedOffShelfAt = now.toISOString();

    item.displayOffShelfAt = new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW');

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    // 保留原本的上架日期
    if (originalItem?.publishedAt) {
      item.publishedAt = originalItem.publishedAt;

      item.displayPublishedAt = new Date(item.publishedAt).toLocaleDateString('zh-TW');
    } else {
      item.displayPublishedAt = '尚未上架';
    }

    this.dailyDemandService.updateDemand(item);

    // 強制重新整理該筆資料的參考，觸發畫面選單更新為「已下架」
    this.refreshItemReference(item);

    this.closeOffShelfWarning();
  }

  // 取消手動下架
  cancelManualOffShelf(): void {
    // 不修改狀態，維持原本狀態
    this.closeOffShelfWarning();
  }

  // 隱藏而不是下架
  hideInsteadOfOffShelf(): void {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = { ...this.pendingOffShelfItem };

    // 選擇隱藏後才真正變成隱藏中
    item.status = '隱藏';
    item.displayStatus = '隱藏中';

    item.publishedAt = undefined;
    item.expectedOffShelfAt = undefined;

    item.displayPublishedAt = '尚未上架';

    item.displayOffShelfAt = '—';

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    this.dailyDemandService.updateDemand(item);

    // 強制重新整理該筆資料的參考，觸發畫面選單更新為「隱藏中」
    this.refreshItemReference(item);

    this.closeOffShelfWarning();
  }

  // 關閉下架提示
  closeOffShelfWarning(): void {
    this.showOffShelfWarning = false;
    this.pendingOffShelfItem = undefined;
  }

  // 關閉無法重新上架提示
  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;
  }
}
