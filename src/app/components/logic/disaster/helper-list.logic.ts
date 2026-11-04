import { Injectable, inject } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { calculateExpectedOffShelfAt, HELPER_OFF_SHELF_DAYS } from '../../../core/demand/expected-off-shelf';
import { HelperDemandService } from '../../../core/services/agency-helper-demand/helper-demand.service';
import { ListUiResult } from '../../../core/ui/list-ui-result';
import { DisplayHelperStatus, HelperDemand, HelperStatus } from '../../../models/agency/helper-demand';
import { HelperFilterState } from '../../filter/helper-filter/helper-filter.component';
import { SortType } from '../../sort-bar/helper-sort-bar/helper-sort-bar.component';

export type HelperListItem = HelperDemand & {
  selected: boolean;
  displayStatus: DisplayHelperStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

/** 協力需求列表專用的 sessionStorage / localStorage key（不可與災害物資列表共用）。 */
export const HELPER_LIST_SCROLL_KEY = 'agency-helper-workspace-scroll';
export const HELPER_LIST_PAGE_KEY = 'agency-helper-workspace-page';
export const HELPER_LIST_RESTORE_KEY = 'restore-agency-helper-list';
export const HELPER_BATCH_EDIT_STORAGE_KEY = 'editHelperDemands';

const DISPLAY_STATUS: Record<HelperStatus, DisplayHelperStatus> = {
  上架: '已上架',
  隱藏: '隱藏中',
  下架: '已下架',
};

@Injectable()
export class HelperListLogic {
  private readonly helperDemandService = inject(HelperDemandService);

  // ───── 資料 ─────
  demands: HelperListItem[] = [];
  filteredDemands: HelperListItem[] = [];
  pagedDemands: HelperListItem[] = [];

  selectAll = false;
  isLoading = false;
  loadError = '';

  // ───── 搜尋 / 篩選 ─────
  searchTerm = '';

  readonly statusOptions: DisplayHelperStatus[] = ['已上架', '隱藏中', '已下架'];
  readonly priorityOptions: HelperDemand['priority'][] = ['普通', '緊急', '非常緊急'];
  readonly typeOptions: NonNullable<HelperDemand['type']>[] = ['物資搬運', '物資整理', '環境清潔', '健康照護', '其他'];
  readonly messageOptions = ['已回覆', '未回覆'];

  selectedFilters: HelperFilterState = this.createEmptyFilters();

  // ───── 排序 ─────
  selectedSort: SortType = 'id';
  sortAscending = true;
  userHasSorted = true;

  // ───── 分頁 ─────
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  // ───── 刪除 / 下架提示 ─────
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  showOffShelfWarning = false;
  showOnShelfWarning = false;
  pendingOffShelfItem?: HelperListItem;

  // ───── 列表位置（sessionStorage） ─────

  /** 進入列表時還原頁數；非返回情境則清掉舊位置，從第 1 頁開始。 */
  restoreListPosition(): void {
    if (sessionStorage.getItem(HELPER_LIST_RESTORE_KEY) === 'true') {
      const savedPage = sessionStorage.getItem(HELPER_LIST_PAGE_KEY);
      if (savedPage) {
        const page = Number(savedPage);
        if (page >= 1) {
          this.currentPage = page;
        }
      }
      // 只使用一次，避免重新進入列表又恢復舊頁數
      sessionStorage.removeItem(HELPER_LIST_RESTORE_KEY);
    } else {
      this.currentPage = 1;
      sessionStorage.removeItem(HELPER_LIST_PAGE_KEY);
      sessionStorage.removeItem(HELPER_LIST_SCROLL_KEY);
    }
  }

  /** 取得已儲存的捲動位置，由 Component 負責實際捲動。 */
  getSavedScrollResult(): ListUiResult {
    const savedScroll = sessionStorage.getItem(HELPER_LIST_SCROLL_KEY);
    if (!savedScroll) {
      return { restoreScrollY: null };
    }
    const scrollY = Number(savedScroll);
    return { restoreScrollY: Number.isNaN(scrollY) ? null : scrollY };
  }

  saveListPosition(scrollY: number): void {
    sessionStorage.setItem(HELPER_LIST_SCROLL_KEY, String(scrollY));
    sessionStorage.setItem(HELPER_LIST_PAGE_KEY, String(this.currentPage));
  }

  /** 離開列表（查看／批次編輯）後返回時，需還原頁數。 */
  markRestoreOnReturn(): void {
    sessionStorage.setItem(HELPER_LIST_RESTORE_KEY, 'true');
  }

  // ───── 讀取 ─────

  async loadDemands(): Promise<void> {
    this.isLoading = true;

    let failed = false;

    const data = await firstValueFrom(
      this.helperDemandService.getDemandsFromServer().pipe(
        catchError(() => {
          failed = true;
          return of(this.helperDemandService.getDemands());
        })
      )
    );

    this.loadError = failed && data.length === 0 ? '協力需求暫時讀不到。請稍後重新整理。' : '';
    this.demands = this.mapDemands(data);

    this.applyFilters(false);

    this.isLoading = false;
  }

  mapDemands(demands: HelperDemand[]): HelperListItem[] {
    return demands.map((item) => ({
      ...item,
      selected: false,
      displayStatus: DISPLAY_STATUS[item.status as HelperStatus],
      displayCreatedAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
      displayPublishedAt:
        item.status === '隱藏' || !item.publishedAt ? '尚未發布' : new Date(item.publishedAt).toLocaleDateString('zh-TW'),
      displayOffShelfAt:
        item.status === '隱藏' || !item.expectedOffShelfAt ? '—' : new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW'),
    }));
  }

  // ───── 搜尋 / 篩選 ─────

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onFilterApply(filters: HelperFilterState): void {
    this.selectedFilters = filters;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilters = this.createEmptyFilters();
    this.applyFilters();
  }

  applyFilters(resetPage = true): void {
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

  filterDemands(demands: HelperListItem[], searchTerm: string, filters: HelperFilterState): HelperListItem[] {
    return demands.filter((item) => {
      // 關鍵字
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();
        const matchItem = item.type ? item.type.toLowerCase().includes(term) : false;
        if (!matchItem) {
          return false;
        }
      }

      // 上架狀態
      if (filters.status.length > 0 && !filters.status.includes(item.displayStatus)) {
        return false;
      }

      // 優先度
      if (filters.priority.length > 0 && !filters.priority.includes(item.priority)) {
        return false;
      }

      // 類別
      if (filters.type.length > 0 && (!item.type || !filters.type.includes(item.type))) {
        return false;
      }

      // 留言狀態（只套用在「已上架」）
      if (filters.messageStatus.length > 0) {
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;
        const wantsReplied = filters.messageStatus.includes('已回覆');
        const wantsNotReplied = filters.messageStatus.includes('未回覆');

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
  }

  // ───── 排序 ─────

  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }): ListUiResult {
    this.selectedSort = event.selectedSort;
    this.sortAscending = event.sortAscending;
    this.userHasSorted = true;
    this.applySort();

    return { preserveScrollY: true };
  }

  applySort(): void {
    this.filteredDemands = this.sortDemands(this.filteredDemands, this.selectedSort, this.sortAscending);
    this.updatePagination();
  }

  sortDemands(demands: HelperListItem[], selectedSort: SortType, sortAscending: boolean): HelperListItem[] {
    return [...demands].sort((a, b) => {
      let result = 0;

      if (selectedSort === 'id') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      if (selectedSort === 'createdAt') {
        result = this.toTime(a.createdAt) - this.toTime(b.createdAt);
      }

      if (selectedSort === 'publishedAt') {
        result = this.toTime(a.publishedAt) - this.toTime(b.publishedAt);
      }

      if (selectedSort === 'expectedOffShelfAt') {
        result = this.toTime(a.expectedOffShelfAt) - this.toTime(b.expectedOffShelfAt);
      }

      if (selectedSort === 'people') {
        result = Number(a.people ?? 0) - Number(b.people ?? 0);
      }

      return sortAscending ? result : -result;
    });
  }

  // ───── 分頁 / 選取 ─────

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDemands.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedDemands = this.filteredDemands.slice(startIndex, startIndex + this.pageSize);
    this.selectAll = this.pagedDemands.length > 0 && this.pagedDemands.every((item) => item.selected);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  toggleAll(): void {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected(): boolean {
    return this.filteredDemands.some((item) => item.selected);
  }

  // ───── 批次編輯 ─────

  prepareBatchEdit(scrollY: number): ListUiResult {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      return { notice: '請先選擇要修改的需求' };
    }

    localStorage.setItem(HELPER_BATCH_EDIT_STORAGE_KEY, JSON.stringify(selectedItems));
    this.saveListPosition(scrollY);
    this.markRestoreOnReturn();

    return { navigateTo: ['/agency/helper-batch-edit'] };
  }

  // ───── 刪除 ─────

  openDeleteModal(id: number): ListUiResult {
    this.deleteIds = [id];
    this.deleteType = 'single';
    this.showDeleteModal = true;
    return { openDeleteModal: true };
  }

  openBatchDeleteModal(): ListUiResult {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => item.id as number);
    this.deleteType = 'batch';
    this.showDeleteModal = true;
    return { openDeleteModal: true };
  }

  closeDeleteModal(): ListUiResult {
    this.showDeleteModal = false;
    return { closeDeleteModal: true };
  }

  async confirmDelete(): Promise<ListUiResult> {
    if (this.deleteIds.length === 0) {
      return {};
    }

    try {
      for (const id of this.deleteIds) {
        await this.helperDemandService.deleteDemand(id);
      }
      await this.onDeleted();
      return { closeDeleteModal: true };
    } catch (error) {
      console.error('刪除協力需求失敗：', error);
      return { notice: '刪除失敗，請確認資料是否存在或是否具有刪除權限。' };
    }
  }

  async onDeleted(): Promise<void> {
    this.showDeleteModal = false;
    this.deleteIds = [];
    this.selectAll = false;
    await this.loadDemands();
  }

  // ───── 狀態變更 ─────

  /** 下拉選單變更。回傳 selectValueRestore 時，Component 需把 select 還原成該值。 */
  async changeStatus(item: HelperListItem, newStatus: DisplayHelperStatus): Promise<ListUiResult> {
    const originalItem = this.findOriginal(item);

    // 選擇「已下架」→ 先還原顯示狀態，等使用者在提示框確認
    if (newStatus === '已下架') {
      if (originalItem?.status === '上架') {
        item.displayStatus = '已上架';
      } else if (originalItem?.status === '隱藏') {
        item.displayStatus = '隱藏中';
      } else if (originalItem?.status === '下架') {
        item.displayStatus = '已下架';
      }

      this.pendingOffShelfItem = item;
      this.showOffShelfWarning = true;
      return { openOffShelfWarning: true, selectValueRestore: item.displayStatus };
    }

    // 已下架 → 禁止重新上架
    if (newStatus === '已上架' && originalItem?.status === '下架') {
      item.displayStatus = '已下架';
      this.showOnShelfWarning = true;
      return { openOnShelfWarning: true, selectValueRestore: '已下架' };
    }

    // 正常變更狀態
    item.displayStatus = newStatus;
    return this.applyStatusChange(item);
  }

  async confirmManualOffShelf(): Promise<ListUiResult> {
    const item = this.pendingOffShelfItem;
    if (!item) {
      return {};
    }

    const now = new Date();

    item.status = '下架';
    // 記錄實際手動下架時間
    item.expectedOffShelfAt = now.toISOString();
    item.displayStatus = '已下架';
    item.displayOffShelfAt = now.toLocaleDateString('zh-TW');
    // 建立日期永遠保留
    item.displayCreatedAt = this.formatCreatedAt(item);

    this.closeOffShelfWarning();

    return this.persist(item, '下架失敗：');
  }

  cancelManualOffShelf(): ListUiResult {
    return this.closeOffShelfWarning();
  }

  /** 選擇「隱藏」取代下架。 */
  async hideInsteadOfOffShelf(): Promise<ListUiResult> {
    const item = this.pendingOffShelfItem;
    if (!item) {
      return {};
    }

    item.status = '隱藏';
    item.displayStatus = '隱藏中';

    // 隱藏後視為尚未上架
    item.publishedAt = undefined;
    item.expectedOffShelfAt = undefined;
    item.displayPublishedAt = '尚未上架';
    item.displayOffShelfAt = '—';
    // 建立日期永遠保留
    item.displayCreatedAt = this.formatCreatedAt(item);

    this.closeOffShelfWarning();

    return this.persist(item, '隱藏失敗：');
  }

  closeOffShelfWarning(): ListUiResult {
    this.showOffShelfWarning = false;
    this.pendingOffShelfItem = undefined;
    return { closeOffShelfWarning: true };
  }

  closeOnShelfWarning(): ListUiResult {
    this.showOnShelfWarning = false;
    return { closeOnShelfWarning: true };
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: HelperDemand['priority']): string {
    return calculateExpectedOffShelfAt(publishedDate, priority, HELPER_OFF_SHELF_DAYS);
  }

  // ───── private ─────

  /** 實際處理「已上架／隱藏中」狀態變更。 */
  private async applyStatusChange(item: HelperListItem): Promise<ListUiResult> {
    const originalItem = this.findOriginal(item);
    const originalStatus = originalItem?.status;

    const status: HelperStatus = item.displayStatus === '隱藏中' ? '隱藏' : '上架';
    const now = new Date();

    if (status === '上架') {
      // 手動下架後禁止重新上架
      if (originalStatus === '下架') {
        item.displayStatus = '已下架';
        this.showOnShelfWarning = true;
        return { openOnShelfWarning: true, selectValueRestore: '已下架' };
      }

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
      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未發布';
      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
    } else {
      item.status = '隱藏';

      // 隱藏後視為尚未上架
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;
      item.displayStatus = '隱藏中';
      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
    }

    // 建立日期永遠保留
    item.displayCreatedAt = this.formatCreatedAt(item);

    return this.persist(item, '狀態更新失敗：');
  }

  private async persist(item: HelperListItem, errorLabel: string): Promise<ListUiResult> {
    try {
      await this.helperDemandService.updateDemand(item);
      return {};
    } catch (error) {
      console.error(errorLabel, error);
      return {};
    }
  }

  private findOriginal(item: HelperListItem): HelperDemand | undefined {
    return this.helperDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
  }

  private formatCreatedAt(item: HelperListItem): string {
    return item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';
  }

  private toTime(value?: string): number {
    return value ? new Date(value).getTime() : 0;
  }

  private createEmptyFilters(): HelperFilterState {
    return {
      status: [],
      priority: [],
      lowRemaining: false,
      type: [],
      messageStatus: [],
    };
  }
}
