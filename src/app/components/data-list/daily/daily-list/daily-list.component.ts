import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subject, takeUntil, timeout, catchError, of } from 'rxjs';
import { DailyDemand, DailyDisplayStatus } from '../../../../models/agency/daily-demand';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';

import { PaginationComponent } from '../../../pagination/pagination.component';
import { DailySearchBarComponent } from '../../../search-bar/daily-search-bar/daily-search-bar.component';
import { DailyFilterComponent } from '../../../filter/daily-filter/daily-filter.component';
import { DailySortBarComponent, SortType } from '../../../sort-bar/daily-sort-bar/daily-sort-bar.component';

import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

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
    SupplyLoadingComponent,
    PaginationComponent,
    DailySearchBarComponent,
    DailySortBarComponent,
    DailyFilterComponent,
  ],
  templateUrl: './daily-list.component.html',
  styleUrls: ['./daily-list-A.component.scss', './daily-list-B.component.scss'],
})
export class DailyListComponent implements OnInit, AfterViewInit, OnDestroy {
  // 資料
  demands: DailyListItem[] = [];
  filteredDemands: DailyListItem[] = [];
  pagedDemands: DailyListItem[] = [];
  selectAll = false;
  isLoading = false;

  private readonly destroy$ = new Subject<void>();

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    history.scrollRestoration = 'manual';
  }

  // 初始化
  ngOnInit(): void {
    // 每次進入列表先顯示第一頁。
    this.currentPage = 1;

    // 不使用舊的 sessionStorage 頁碼。
    sessionStorage.removeItem(this.pagePositionKey);

    // 第一次進入列表時讀取資料。
    void this.loadDemands();
    // 每次路由成功完成時都印出最後網址，
    // 先用它確認真正的列表路由。
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        console.log('Router NavigationEnd：', event.urlAfterRedirects);

        // 只要網址是 /agency/daily 開頭，
        // 例如 /agency/daily 或 /agency/daily?refresh=1，
        // 都重新讀取最新資料。
        const url = event.urlAfterRedirects;

        if (url === '/agency/daily' || url.startsWith('/agency/daily?')) {
          this.currentPage = 1;

          void this.loadDemands();
        }
      });
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
  goToDetail(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListComponent] 無法前往詳細頁，資料庫 id 不正確：', id);

      return;
    }

    this.saveListPosition();

    this.router.navigate(['/agency/daily-detail', id]);
  }

  // 編輯
  goToEdit(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListComponent] 無法前往編輯頁，資料庫 id 不正確：', id);

      return;
    }

    this.saveListPosition();

    this.router.navigate(['/agency/daily-edit', id]);
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
  async loadDemands(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      // 嘗試從伺服器或 Service 取得資料
      this.dailyDemandService
        .getDemandsFromServer()
        .pipe(
          timeout(2000),
          catchError(() => {
            return of(this.dailyDemandService.getDemands());
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((data) => {
          this.demands = data.map((item) => {
            // 1. 先檢查是否已達到預計下架日期
            const checkedItem = this.checkNaturalOffShelf(item);

            // 2. 轉換狀態顯示文字
            let displayStatus: DailyDisplayStatus;
            switch (checkedItem.status) {
              case '上架':
                displayStatus = '已上架';
                break;
              case '隱藏':
                displayStatus = '隱藏中';
                break;
              case '下架':
                displayStatus = '已下架';
                break;
              default:
                displayStatus = '隱藏中';
                break;
            }

            return {
              ...checkedItem,
              selected: false,
              displayStatus,
              displayCreatedAt: checkedItem.createdAt ? new Date(checkedItem.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
              displayPublishedAt: checkedItem.publishedAt ? new Date(checkedItem.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',
              displayOffShelfAt: checkedItem.expectedOffShelfAt
                ? new Date(checkedItem.expectedOffShelfAt).toLocaleDateString('zh-TW')
                : '—',
              remaining: checkedItem.remaining ?? checkedItem.amount ?? 0,
              category: checkedItem.category ?? '其他',
            };
          });

          this.applyFilters(false);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
    } catch (error) {
      console.error('載入日常需求失敗：', error);
      this.demands = [];
      this.filteredDemands = [];
      this.pagedDemands = [];
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // 檢查是否已達到預計下架日期
  private checkNaturalOffShelf(item: DailyDemand): DailyDemand {
    // 只有目前是「上架」才需要檢查
    if (item.status !== '上架') {
      return item;
    }

    // 沒有預計下架日期，不處理
    if (!item.expectedOffShelfAt) {
      return item;
    }

    const now = new Date();
    const expectedOffShelfAt = new Date(item.expectedOffShelfAt);

    // 已經到達或超過預計下架日期
    if (now >= expectedOffShelfAt) {
      item.status = '下架';

      // 記錄為「自然下架」
      item.offShelfReason = 'natural';

      // 同步更新 Service
      this.dailyDemandService.updateDemand(item);
    }

    return item;
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
        // 留言篩選只套用在「已上架」
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = this.selectedFilters.messageStatus.includes('已回覆');
        const wantsNotReplied = this.selectedFilters.messageStatus.includes('未回覆');

        // 有回覆 → 留言數大於 0
        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        // 未回覆 → 留言數等於 0
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
  openDeleteModal(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListComponent] 無法刪除，資料庫 id 不正確：', id);

      return;
    }

    this.deleteIds = [id];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  // 批次刪除
  openBatchDeleteModal(): void {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => Number(item.id));

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
  async onDeleted(): Promise<void> {
    this.showDeleteModal = false;
    this.deleteIds = [];
    this.selectAll = false;

    this.cdr.detectChanges();

    await this.loadDemands();

    this.cdr.detectChanges();
  }

  // 修改狀態
  async changeStatus(item: DailyListItem, newStatus: DailyDisplayStatus): Promise<void> {
    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const originalStatus = originalItem?.status;

    // 1. 選擇「已上架」
    if (newStatus === '已上架') {
      // 只有「手動下架」才禁止重新上架
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';

        // 還原下拉選單
        this.refreshItemReference(item);

        // 顯示無法重新上架提示
        this.showOnShelfWarning = true;
        return;
      }

      // 自然下架可以重新上架
      const now = new Date();

      item.publishedAt = now.toISOString();

      const updatedItem: DailyListItem = {
        ...item,
        status: '上架',
        displayStatus: '已上架',

        createdAt: item.createdAt ?? now.toISOString(),

        publishedAt: now.toISOString(),

        expectedOffShelfAt: this.calculateExpectedOffShelfDate(now, item.priority),

        displayCreatedAt:
          (item.createdAt ?? now.toISOString()) ? new Date(item.createdAt ?? now.toISOString()).toLocaleDateString('zh-TW') : '尚未建立',

        displayPublishedAt: now.toLocaleDateString('zh-TW'),

        displayOffShelfAt: this.calculateExpectedOffShelfDate(now, item.priority)
          ? new Date(this.calculateExpectedOffShelfDate(now, item.priority)).toLocaleDateString('zh-TW')
          : '—',
      };

      try {
        await this.dailyDemandService.updateDemand(updatedItem);

        this.refreshItemReference(updatedItem);

        this.cdr.detectChanges();

        console.log('日常物資已上架並儲存至 Supabase：', updatedItem);
      } catch (error) {
        console.error('上架更新失敗：', error);

        alert('上架失敗，請確認 Supabase 設定。');

        this.loadDemands();
      }

      // 重新計算預計下架日期
      item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);

      item.status = '上架';

      // 重新上架後，清除之前的下架原因
      item.offShelfReason = undefined;

      item.displayStatus = '已上架';

      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';

      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';

      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);

      return;
    }

    // 2. 選擇「已下架」
    if (newStatus === '已下架') {
      // 已經是下架狀態，就維持下架
      if (originalStatus === '下架') {
        item.status = '下架';
        item.displayStatus = '已下架';

        this.refreshItemReference(item);
        return;
      }

      // 尚未下架，先顯示確認 Modal
      this.pendingOffShelfItem = item;

      this.refreshItemReference(item);

      this.showOffShelfWarning = true;

      return;
    }

    // 3. 選擇「隱藏中」
    if (newStatus === '隱藏中') {
      // 手動下架後不能改回隱藏
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';

        this.refreshItemReference(item);
        return;
      }

      item.status = '隱藏';
      item.displayStatus = '隱藏中';

      // 隱藏後清除上架相關資料
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;

      // 隱藏不是下架，因此清除下架原因
      item.offShelfReason = undefined;

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
  async confirmManualOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = { ...this.pendingOffShelfItem };

    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.id === item.id);

    const now = new Date();

    // 確認後才真正變成已下架
    item.status = '下架';
    item.displayStatus = '已下架';

    // 記錄這次是「手動下架」
    item.offShelfReason = 'manual';

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

    try {
      await this.dailyDemandService.updateDemand(item);

      this.refreshItemReference(item);

      this.closeOffShelfWarning();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('下架更新失敗：', error);

      alert('下架失敗，請稍後再試。');

      this.closeOffShelfWarning();

      this.loadDemands();
    }
  }

  // 取消手動下架
  cancelManualOffShelf(): void {
    // 不修改狀態，維持原本狀態
    this.closeOffShelfWarning();
  }

  // 隱藏而不是下架
  async hideInsteadOfOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
    }

    const item = { ...this.pendingOffShelfItem };

    // 選擇隱藏後才真正變成隱藏中
    item.status = '隱藏';
    item.displayStatus = '隱藏中';

    item.offShelfReason = undefined;

    item.publishedAt = undefined;
    item.expectedOffShelfAt = undefined;

    item.displayPublishedAt = '尚未上架';

    item.displayOffShelfAt = '—';

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    try {
      await this.dailyDemandService.updateDemand(item);

      this.refreshItemReference(item);

      this.closeOffShelfWarning();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('隱藏失敗：', error);

      alert('隱藏失敗，請稍後再試。');

      this.closeOffShelfWarning();

      this.loadDemands();
    }
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
