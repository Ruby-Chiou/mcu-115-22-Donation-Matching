import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, of, takeUntil, timeout } from 'rxjs';
import { calculateExpectedOffShelfAt, DAILY_OFF_SHELF_DAYS } from '../../../core/demand/expected-off-shelf';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyCommentService } from '../../../core/services/comments/daily-comment.service';
import type { ListUiResult } from '../../../core/ui/list-ui-result';
import { DailyDemand, DailyDisplayStatus } from '../../../models/agency/daily-demand';
import type { SortType } from '../../sort-bar/daily-sort-bar/daily-sort-bar.component';

export type ReceiveMethod = '寄送' | '面交';
export type DailyFilterState = {
  status: string[];
  priority: string[];
  receiveMethod: ReceiveMethod[];
  lowRemaining: boolean;
  category: string[];
  messageStatus: string[];
};

export type DailyListItem = DailyDemand & {
  selected: boolean;
  displayStatus: DailyDisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

@Injectable()
export class DailyListLogic {
  private readonly dailyDemandService = inject(DailyDemandService);
  private readonly dailyCommentService = inject(DailyCommentService);

  // ── view-model state ──────────────────────────────────────────────
  demands: DailyListItem[] = [];
  filteredDemands: DailyListItem[] = [];
  pagedDemands: DailyListItem[] = [];
  selectAll = false;
  isLoading = false;
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];
  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  userHasSorted = false;
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';
  showFilterModal = false;
  showOffShelfWarning = false;
  showOnShelfWarning = false;
  pendingOffShelfItem?: DailyListItem;
  pendingOffShelfPreviousStatus?: DailyDisplayStatus;

  readonly statusOptions: DailyDisplayStatus[] = ['已上架', '隱藏中', '已下架'];
  readonly priorityOptions: DailyDemand['priority'][] = ['普通', '緊急', '非常緊急'];
  readonly receiveMethodOptions: ReceiveMethod[] = ['寄送', '面交'];
  readonly categoryOptions: NonNullable<DailyDemand['category']>[] = [
    '食品與飲用水',
    '衣物與保暖用品',
    '健康與照護用品',
    '清潔與衛生用品',
    '嬰幼兒用品',
    '長者與身心障礙用品',
    '女性生理用品',
    '寵物與動物用品',
    '防災與照明用品',
    '通訊與求救用品',
    '生活與炊事用品',
    '其他',
  ];
  readonly messageOptions: string[] = ['已回覆', '未回覆'];

  selectedFilters: DailyFilterState = this.createEmptyFilters();

  // ── session storage keys ──────────────────────────────────────────
  readonly scrollPositionKey = 'agency-daily-workspace-scroll';
  readonly pagePositionKey = 'agency-daily-workspace-page';
  readonly restoreFlagKey = 'restore-agency-daily-list';

  // ── lifecycle / change notification ───────────────────────────────
  private readonly destroy$ = new Subject<void>();
  private readonly stateChanges$ = new Subject<'mark' | 'detect'>();

  /** Emits when Logic is destroyed; component may use it for takeUntil. */
  get destroyed$(): Observable<void> {
    return this.destroy$.asObservable();
  }

  /** Component subscribes and calls markForCheck/detectChanges accordingly. */
  get stateChanges(): Observable<'mark' | 'detect'> {
    return this.stateChanges$.asObservable();
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateChanges$.complete();
  }

  // ── init / position ───────────────────────────────────────────────
  /** Restore saved page (when returning from detail/edit) or reset position storage. */
  restorePosition(): void {
    if (sessionStorage.getItem(this.restoreFlagKey) === 'true') {
      const savedPage = sessionStorage.getItem(this.pagePositionKey);
      if (savedPage) {
        const page = Number(savedPage);
        if (page >= 1) {
          this.currentPage = page;
        }
      }
      sessionStorage.removeItem(this.restoreFlagKey);
    } else {
      this.currentPage = 1;
      sessionStorage.removeItem(this.pagePositionKey);
      sessionStorage.removeItem(this.scrollPositionKey);
    }
  }

  /** Scroll position to restore after view init (if any). */
  getRestoreScroll(): ListUiResult {
    const savedScroll = sessionStorage.getItem(this.scrollPositionKey);
    if (!savedScroll) {
      return {};
    }
    return { restoreScrollY: Number(savedScroll) };
  }

  snapshotPosition(scrollY: number): void {
    sessionStorage.setItem(this.scrollPositionKey, String(scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // ── navigation intents ────────────────────────────────────────────
  goToAddDemand(): ListUiResult {
    return { navigateTo: ['/agency/daily-form'] };
  }

  goToDetail(serialNo: number | undefined, scrollY: number): ListUiResult {
    if (serialNo == null || !Number.isInteger(Number(serialNo))) {
      console.error('無法前往日常需求詳細頁，需求編號不正確：', serialNo);
      return {};
    }
    this.snapshotPosition(scrollY);
    sessionStorage.setItem(this.restoreFlagKey, 'true');
    return { navigateTo: ['/agency/daily-detail', serialNo] };
  }

  goToEdit(id: number, scrollY: number): ListUiResult {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListLogic] 無法前往編輯頁，資料庫 id 不正確：', id);
      return {};
    }
    this.snapshotPosition(scrollY);
    sessionStorage.setItem(this.restoreFlagKey, 'true');
    return { navigateTo: ['/agency/daily-edit', id] };
  }

  // ── sort ──────────────────────────────────────────────────────────
  onSortChange(value: SortType): ListUiResult {
    this.selectedSort = value;
    this.userHasSorted = true;
    this.applySort();
    return { preserveScrollY: true };
  }

  onSortOrderChange(ascending: boolean): ListUiResult {
    this.userHasSorted = true;
    this.sortAscending = ascending;
    this.applySort();
    return { preserveScrollY: true };
  }

  // ── load ──────────────────────────────────────────────────────────
  /** Resolves once the load finishes (or is skipped / cancelled). */
  loadDemands(): Promise<ListUiResult> {
    if (this.isLoading) {
      return Promise.resolve({});
    }

    this.isLoading = true;
    this.stateChanges$.next('mark');

    return new Promise<ListUiResult>((resolve) => {
      try {
        this.dailyDemandService
          .getDemandsFromServer()
          .pipe(
            timeout(2000),
            catchError(() => {
              return of(this.dailyDemandService.getDemands());
            }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: async (data) => {
              try {
                const mappedDemands = this.mapDemands(data, (item) => this.dailyDemandService.updateDemand(item));

                await Promise.all(
                  mappedDemands.map(async (item) => {
                    if (item.id == null) {
                      item.messageCount = 0;
                      return;
                    }

                    item.messageCount = await this.dailyCommentService.getCommentCount(Number(item.id));
                  })
                );

                this.demands = mappedDemands;
                this.applyFilters(false);
              } catch (error) {
                console.error('載入日常需求或留言數量失敗：', error);
                this.clearLists();
              } finally {
                this.isLoading = false;
                this.stateChanges$.next('detect');
                resolve({});
              }
            },
            error: (error) => {
              console.error('載入日常需求失敗：', error);
              this.clearLists();
              this.isLoading = false;
              this.stateChanges$.next('detect');
              resolve({});
            },
            complete: () => resolve({}),
          });
      } catch (error) {
        console.error('載入日常需求失敗：', error);
        this.clearLists();
        this.isLoading = false;
        this.stateChanges$.next('detect');
        resolve({});
      }
    });
  }

  private clearLists(): void {
    this.demands = [];
    this.filteredDemands = [];
    this.pagedDemands = [];
  }

  // ── search / filter ───────────────────────────────────────────────
  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  resetFilters(): void {
    this.selectedFilters = this.createEmptyFilters();
    this.applyFilters();
    this.showFilterModal = false;
  }

  applyFilterFromModal(): void {
    this.applyFilters();
    this.showFilterModal = false;
  }

  applyFilters(resetPage: boolean = true): void {
    this.filteredDemands = this.filterDemands(this.demands, this.searchTerm, this.selectedFilters);

    if (resetPage) {
      this.currentPage = 1;
    }
    if (this.userHasSorted) {
      this.applySort();
    } else {
      this.updatePagination();
    }
  }

  applySort(): void {
    this.sortDemands(this.filteredDemands, this.selectedSort, this.sortAscending);
    this.updatePagination();
  }

  updatePagination(): void {
    const result = this.getPaginationData(this.filteredDemands, this.currentPage, this.pageSize);
    this.currentPage = result.currentPage;
    this.totalPages = result.totalPages;
    this.pageNumbers = result.pageNumbers;
    this.pagedDemands = result.pagedDemands;
    this.selectAll = result.selectAll;
  }

  goToPage(page: number): ListUiResult {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      return { scrollTop: true };
    }
    return {};
  }

  // ── selection / batch ─────────────────────────────────────────────
  toggleAll(): void {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected(): boolean {
    return this.filteredDemands.some((item) => item.selected);
  }

  editSelected(scrollY: number): ListUiResult {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      return { notice: '請先選擇要修改的需求' };
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));
    this.snapshotPosition(scrollY);
    return { navigateTo: ['/agency/daily-batch-edit'] };
  }

  // ── delete flow ───────────────────────────────────────────────────
  openDeleteModal(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListLogic] 無法刪除，資料庫 id 不正確：', id);
      return;
    }
    this.deleteIds = [id];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  openBatchDeleteModal(): ListUiResult {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => Number(item.id));
    if (this.deleteIds.length === 0) {
      return { notice: '請先選擇要刪除的需求' };
    }
    this.deleteType = 'batch';
    this.showDeleteModal = true;
    return {};
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  async confirmDelete(): Promise<ListUiResult> {
    if (this.deleteIds.length === 0) {
      return {};
    }

    try {
      for (const id of this.deleteIds) {
        await this.dailyDemandService.deleteDemand(id);
      }
      await this.onDeleted();
      return {};
    } catch (error) {
      console.error('刪除物資需求失敗：', error);
      return { notice: '刪除失敗，請確認資料是否存在或是否具有刪除權限。' };
    }
  }

  async onDeleted(): Promise<void> {
    this.showDeleteModal = false;
    this.deleteIds = [];
    this.selectAll = false;
    this.stateChanges$.next('detect');
    await this.loadDemands();
    this.stateChanges$.next('detect');
  }

  // ── status change ─────────────────────────────────────────────────
  async changeStatus(item: DailyListItem, newStatus: DailyDisplayStatus): Promise<ListUiResult> {
    const result: ListUiResult = {};
    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
    const originalStatus = originalItem?.status;

    if (newStatus === '已上架') {
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        this.showOnShelfWarning = true;
        return result;
      }

      const now = new Date();
      item.publishedAt = now.toISOString();
      const expectedOffShelfAt = this.calculateExpectedOffShelfDate(now, item.priority);
      const updatedItem: DailyListItem = {
        ...item,
        status: '上架',
        displayStatus: '已上架',
        createdAt: item.createdAt ?? now.toISOString(),
        publishedAt: now.toISOString(),
        expectedOffShelfAt,
        displayCreatedAt: new Date(item.createdAt ?? now.toISOString()).toLocaleDateString('zh-TW'),
        displayPublishedAt: now.toLocaleDateString('zh-TW'),
        displayOffShelfAt: expectedOffShelfAt ? new Date(expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
      };

      try {
        await this.dailyDemandService.updateDemand(updatedItem);

        this.refreshItemReference(updatedItem);
        this.stateChanges$.next('detect');

        console.log('日常物資已上架並儲存至 Supabase：', updatedItem);
      } catch (error) {
        console.error('上架更新失敗：', error);

        result.notice = '上架失敗，請確認 Supabase 設定。';

        void this.loadDemands();
      }

      item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      item.status = '上架';
      item.offShelfReason = undefined;
      item.displayStatus = '已上架';
      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';
      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);

      return result;
    }

    if (newStatus === '已下架') {
      if (originalStatus === '下架') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return result;
      }

      this.pendingOffShelfItem = item;
      this.pendingOffShelfPreviousStatus =
        originalStatus === '隱藏' ? '隱藏中' : originalStatus === '上架' ? '已上架' : item.displayStatus;
      this.refreshItemReference(item);
      this.showOffShelfWarning = true;

      return result;
    }

    if (newStatus === '隱藏中') {
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return result;
      }

      item.status = '隱藏';
      item.displayStatus = '隱藏中';
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;
      item.offShelfReason = undefined;
      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);

      return result;
    }

    return result;
  }

  async confirmManualOffShelf(): Promise<ListUiResult> {
    if (!this.pendingOffShelfItem) {
      return {};
    }

    const item = {
      ...this.pendingOffShelfItem,
    };

    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.id === item.id);
    const now = new Date();

    item.status = '下架';
    item.displayStatus = '已下架';
    item.offShelfReason = 'manual';
    item.expectedOffShelfAt = now.toISOString();
    item.displayOffShelfAt = new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW');
    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    if (originalItem?.publishedAt) {
      item.publishedAt = originalItem.publishedAt;

      item.displayPublishedAt = new Date(item.publishedAt).toLocaleDateString('zh-TW');
    } else {
      item.displayPublishedAt = '尚未上架';
    }

    try {
      await this.dailyDemandService.updateDemand(item);

      this.refreshItemReference(item);
      this.dismissOffShelfWarning();
      this.stateChanges$.next('detect');
      return {};
    } catch (error) {
      console.error('下架更新失敗：', error);

      this.closeOffShelfWarning();
      void this.loadDemands();
      return { notice: '下架失敗，請稍後再試。' };
    }
  }

  cancelManualOffShelf(): void {
    this.closeOffShelfWarning();
  }

  async hideInsteadOfOffShelf(): Promise<ListUiResult> {
    if (!this.pendingOffShelfItem) {
      return {};
    }

    const item = {
      ...this.pendingOffShelfItem,
    };

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
      this.dismissOffShelfWarning();
      this.stateChanges$.next('detect');
      return {};
    } catch (error) {
      console.error('隱藏失敗：', error);

      this.closeOffShelfWarning();
      void this.loadDemands();
      return { notice: '隱藏失敗，請稍後再試。' };
    }
  }

  /** 取消下架時還原下拉選單狀態。 */
  closeOffShelfWarning(): void {
    if (this.pendingOffShelfItem && this.pendingOffShelfPreviousStatus) {
      this.pendingOffShelfItem.displayStatus = this.pendingOffShelfPreviousStatus;
      this.refreshItemReference(this.pendingOffShelfItem);
    }
    this.dismissOffShelfWarning();
  }

  private dismissOffShelfWarning(): void {
    this.showOffShelfWarning = false;
    this.pendingOffShelfItem = undefined;
    this.pendingOffShelfPreviousStatus = undefined;
    this.stateChanges$.next('detect');
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;
  }

  refreshItemReference(item: DailyListItem): void {
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

  private createEmptyFilters(): DailyFilterState {
    return {
      status: [],
      priority: [],
      receiveMethod: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }

  // ── pure helpers ──────────────────────────────────────────────────
  checkNaturalOffShelf(item: DailyDemand, updateDemand: (item: DailyDemand) => void): DailyDemand {
    if (item.status !== '上架') {
      return item;
    }

    if (!item.expectedOffShelfAt) {
      return item;
    }

    const now = new Date();
    const expectedOffShelfAt = new Date(item.expectedOffShelfAt);

    if (now >= expectedOffShelfAt) {
      item.status = '下架';
      item.offShelfReason = 'natural';
      updateDemand(item);
    }

    return item;
  }

  mapDemands(data: DailyDemand[], updateDemand: (item: DailyDemand) => void): DailyListItem[] {
    return data.map((item) => {
      const checkedItem = this.checkNaturalOffShelf(item, updateDemand);

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
        displayOffShelfAt: checkedItem.expectedOffShelfAt ? new Date(checkedItem.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
        remaining: checkedItem.remaining ?? checkedItem.amount ?? 0,
        category: checkedItem.category ?? '其他',
      };
    });
  }

  filterDemands(demands: DailyListItem[], searchTerm: string, selectedFilters: DailyFilterState): DailyListItem[] {
    return demands.filter((item) => {
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();

        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;

        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      if (selectedFilters.priority.length > 0 && !selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      if (selectedFilters.receiveMethod.length > 0) {
        const selectedMethods = selectedFilters.receiveMethod;

        const matchReceiveMethod = selectedMethods.some((method) => {
          return item.receiveMethod?.[method] === true;
        });

        if (!matchReceiveMethod) {
          return false;
        }
      }

      if (selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      if (selectedFilters.category.length > 0 && (!item.category || !selectedFilters.category.includes(item.category))) {
        return false;
      }

      if (selectedFilters.messageStatus.length > 0) {
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        if (wantsNotReplied && !wantsReplied && hasMsg) {
          return false;
        }
      }

      return true;
    });
  }

  sortDemands(demands: DailyListItem[], selectedSort: string, sortAscending: boolean): DailyListItem[] {
    demands.sort((a, b) => {
      let result = 0;

      if (selectedSort === 'serialNo') {
        result = a.serialNo - b.serialNo;
      }

      if (selectedSort === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();

        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();

        result = aTime - bTime;
      }

      if (selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      if (selectedSort === 'publishedAt') {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;

        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

        result = aTime - bTime;
      }

      if (selectedSort === 'expectedOffShelfAt') {
        const aTime = a.expectedOffShelfAt ? new Date(a.expectedOffShelfAt).getTime() : 0;

        const bTime = b.expectedOffShelfAt ? new Date(b.expectedOffShelfAt).getTime() : 0;

        result = aTime - bTime;
      }

      return sortAscending ? result : -result;
    });

    return demands;
  }

  getPaginationData(
    filteredDemands: DailyListItem[],
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    currentPage: number;
    pageNumbers: number[];
    pagedDemands: DailyListItem[];
    selectAll: boolean;
  } {
    const totalPages = Math.ceil(filteredDemands.length / pageSize) || 1;

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageNumbers = Array.from(
      {
        length: totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (currentPage - 1) * pageSize;

    const endIndex = startIndex + pageSize;

    const pagedDemands = filteredDemands.slice(startIndex, endIndex);

    const selectAll = pagedDemands.length > 0 && pagedDemands.every((item) => item.selected);

    return {
      totalPages,
      currentPage,
      pageNumbers,
      pagedDemands,
      selectAll,
    };
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    return calculateExpectedOffShelfAt(publishedDate, priority, DAILY_OFF_SHELF_DAYS);
  }
}
