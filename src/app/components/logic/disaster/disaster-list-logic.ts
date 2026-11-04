import { Injectable, inject } from '@angular/core';
import { calculateExpectedOffShelfAt, DISASTER_OFF_SHELF_DAYS } from '../../../core/demand/expected-off-shelf';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand, DisasterStatus, DisplayStatus } from '../../../models/agency/disaster-demand';
import { SupplyFilterState } from '../../filter/supply-filter/supply-filter.component';
import { SortType } from '../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { DisasterCommentService } from '../../../core/services/comments/disaster-comment.service';
import { ListUiResult } from '../../../core/ui/list-ui-result';

export type DisasterListItem = DisasterDemand & {
  selected: boolean;
  displayStatus: DisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

/**
 * 災害物資列表 Logic：持有列表 VM 狀態與 domain 操作。
 * 不直接呼叫 alert / window.scrollTo；UI 行為以 ListUiResult 回傳給 Component 套用。
 */
@Injectable()
export class DisasterListLogic {
  private readonly disasterDemandService = inject(DisasterDemandService);
  private readonly disasterCommentService = inject(DisasterCommentService);

  /** 資料異動事件（Component 訂閱後呼叫 loadDemands(false)） */
  readonly demandChanged$ = this.disasterDemandService.demandChanged$;

  // ===== 列表 VM 狀態 =====
  demands: DisasterListItem[] = [];
  filteredDemands: DisasterListItem[] = [];
  pagedDemands: DisasterListItem[] = [];

  selectAll = false;
  isLoading = false;
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  private userHasSorted = true;

  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  pendingOffShelfItem?: DisasterListItem;

  readonly statusOptions: DisplayStatus[] = ['已上架', '隱藏中', '已下架'];
  readonly priorityOptions: DisasterDemand['priority'][] = ['普通', '緊急', '非常緊急'];
  readonly categoryOptions: NonNullable<DisasterDemand['category']>[] = [
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
    '居住安置與修繕用品',
    '其他',
  ];
  readonly messageOptions = ['已回覆', '未回覆'];

  selectedFilters: SupplyFilterState = this.createEmptyFilters();

  private readonly scrollPositionKey = 'agency-disaster-workspace-scroll';
  private readonly pagePositionKey = 'agency-disaster-workspace-page';
  private readonly restoreFlagKey = 'restore-agency-disaster-list';

  // ===== 初始化／位置還原 =====

  /** 依 sessionStorage 還原頁碼；非還原情境則重置頁碼與捲動位置。 */
  initFromSession(): void {
    const restoreListPosition = sessionStorage.getItem(this.restoreFlagKey);

    if (restoreListPosition === 'true') {
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

  /** 取得要還原的捲動位置（交由 Component 實際捲動）。 */
  getRestoreScrollResult(): ListUiResult {
    const savedScroll = sessionStorage.getItem(this.scrollPositionKey);

    if (!savedScroll) {
      return {};
    }

    return { restoreScrollY: Number(savedScroll) };
  }

  /** 記錄目前列表位置（scrollY 由 Component 提供）。 */
  saveListPosition(scrollY: number): void {
    sessionStorage.setItem(this.scrollPositionKey, String(scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  /** 標記回到列表時需要還原位置。 */
  markRestoreListPosition(): void {
    sessionStorage.setItem(this.restoreFlagKey, 'true');
  }

  // ===== 導覽 =====

  resolveAddNavigation(): ListUiResult {
    return { navigateTo: ['/agency/supply-form'] };
  }

  resolveDetailNavigation(id: number | undefined): ListUiResult {
    if (!this.isValidDbId(id)) {
      console.error('無法前往災害物資詳細頁，資料庫 id 不正確：', id);
      return {};
    }

    return { navigateTo: ['/agency/supply-detail', id] };
  }

  resolveEditNavigation(id: number | undefined): ListUiResult {
    if (!this.isValidDbId(id)) {
      console.error('無法前往災害物資編輯頁，資料庫 id 不正確：', id);
      return {};
    }

    return { navigateTo: ['/agency/supply-edit', id] };
  }

  // ===== 載入 =====

  async loadDemands(showLoading = true): Promise<ListUiResult> {
    if (this.isLoading) {
      return {};
    }

    if (showLoading) {
      this.isLoading = true;
    }

    try {
      await this.disasterDemandService.reload();

      this.demands = this.mapDemands(this.disasterDemandService.getDemands());

      this.demands = await this.loadMessageCounts(this.demands);

      this.filteredDemands = [...this.demands];
      this.updatePagination();
    } catch (error) {
      console.error('載入物資需求失敗：', error);

      this.demands = [];
      this.filteredDemands = [];
      this.pagedDemands = [];
    } finally {
      if (showLoading) {
        this.isLoading = false;
      }
    }

    return {};
  }

  // ===== 搜尋／篩選／排序／分頁 =====

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onFilterApply(filters: SupplyFilterState): void {
    this.selectedFilters = filters;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilters = this.createEmptyFilters();
    this.applyFilters();
  }

  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }): ListUiResult {
    this.selectedSort = event.selectedSort;
    this.sortAscending = event.sortAscending;
    this.userHasSorted = true;
    this.applySort();

    return { preserveScrollY: true };
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

  applySort(): void {
    this.filteredDemands = this.sortDemands(this.filteredDemands, this.selectedSort, this.sortAscending);
    this.updatePagination();
  }

  updatePagination(): void {
    const result = this.getPaginationData(this.filteredDemands, this.currentPage, this.pageSize);

    this.totalPages = result.totalPages;
    this.pageNumbers = result.pageNumbers;
    this.pagedDemands = result.pagedDemands;
    this.currentPage = result.currentPage;
    this.selectAll = result.selectAll;

    console.log('目前頁數：', this.currentPage);
    console.log('每頁筆數：', this.pageSize);
    console.log('目前頁面資料：', this.pagedDemands.length);
    console.log('目前頁面資料內容：', this.pagedDemands);
  }

  goToPage(page: number): ListUiResult {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();

      return { scrollTop: true };
    }

    return {};
  }

  // ===== 選取／批次編輯 =====

  toggleAll(): void {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected(): boolean {
    return this.filteredDemands.some((item) => item.selected);
  }

  /** 準備批次編輯資料；成功時回傳導覽目標，Component 負責記錄位置後導頁。 */
  prepareBatchEdit(): ListUiResult {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      return { notice: '請先選擇要修改的需求' };
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    return { navigateTo: ['/agency/supply-batch-edit'] };
  }

  // ===== 刪除流程 =====

  /** 註：沿用原行為，單筆刪除傳入的是 serialNo，confirmDelete 直接以此值呼叫 deleteDemand。 */
  openDeleteModal(serialNo: number): ListUiResult {
    this.deleteIds = [serialNo];
    this.deleteType = 'single';

    return { openDeleteModal: true };
  }

  openBatchDeleteModal(): ListUiResult {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => item.id as number);
    this.deleteType = 'batch';

    return { openDeleteModal: true };
  }

  closeDeleteModal(): ListUiResult {
    return { closeDeleteModal: true };
  }

  /**
   * @param emit 中途 UI 意圖（例如刪除成功後先關閉 modal，再等待重新載入）。
   */
  async confirmDelete(emit?: (result: ListUiResult) => void): Promise<ListUiResult> {
    if (this.deleteIds.length === 0) {
      return {};
    }

    try {
      for (const id of this.deleteIds) {
        await this.disasterDemandService.deleteDemand(id);
      }
      return await this.onDeleted(emit);
    } catch (error) {
      console.error('刪除物資需求失敗：', error);
      return { notice: '刪除失敗，請確認資料是否存在或是否具有刪除權限。' };
    }
  }

  async onDeleted(emit?: (result: ListUiResult) => void): Promise<ListUiResult> {
    this.deleteIds = [];
    this.selectAll = false;
    emit?.({ closeDeleteModal: true });
    const loadResult = await this.loadDemands();

    return { ...loadResult, closeDeleteModal: true };
  }

  // ===== 狀態變更／手動下架／隱藏 =====

  changeStatus(item: DisasterListItem, newStatus: DisplayStatus): ListUiResult {
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.id === item.id);

    // 選擇「已下架」
    if (newStatus === '已下架') {
      item.displayStatus = originalItem?.status === '上架' ? '已上架' : originalItem?.status === '下架' ? '已下架' : '隱藏中';

      this.pendingOffShelfItem = item;

      return {
        selectValueRestore: item.displayStatus,
        openOffShelfWarning: true,
      };
    }

    if (newStatus === '已上架' && item.status === '下架') {
      const offShelfReason = item.offShelfReason ?? originalItem?.offShelfReason;

      // 只有「手動下架」不能重新上架
      if (offShelfReason === 'manual') {
        item.displayStatus = '已下架';

        return {
          selectValueRestore: '已下架',
          openOnShelfWarning: true,
        };
      }

      // 自然下架可以重新上架
      item.displayStatus = '已上架';
      void this.applyStatusChange(item);
      return {};
    }

    // 隱藏中 → 其他狀態
    item.displayStatus = newStatus;
    void this.applyStatusChange(item);
    return {};
  }

  async confirmManualOffShelf(): Promise<ListUiResult> {
    if (!this.pendingOffShelfItem) {
      return {};
    }

    const item = this.pendingOffShelfItem;
    const now = new Date();

    item.status = '下架';
    item.offShelfReason = 'manual';
    item.expectedOffShelfAt = now.toISOString();
    item.displayStatus = '已下架';
    item.displayOffShelfAt = now.toLocaleDateString('zh-TW');

    try {
      await this.disasterDemandService.updateDemand(item);
      await this.loadDemands(false);
    } catch (error) {
      console.error('下架失敗：', error);
    } finally {
      this.clearPendingOffShelf();
    }

    return { closeOffShelfWarning: true };
  }

  cancelManualOffShelf(): ListUiResult {
    return this.closeOffShelfWarning();
  }

  async hideInsteadOfOffShelf(): Promise<ListUiResult> {
    if (!this.pendingOffShelfItem) {
      return {};
    }

    const item = this.pendingOffShelfItem;

    item.status = '隱藏';
    item.offShelfReason = undefined;
    item.publishedAt = undefined;
    item.expectedOffShelfAt = undefined;
    item.displayStatus = '隱藏中';
    item.displayPublishedAt = '尚未上架';
    item.displayOffShelfAt = '—';

    try {
      await this.disasterDemandService.updateDemand(item);
      await this.loadDemands(false);
    } catch (error) {
      console.error('隱藏失敗：', error);
    } finally {
      this.clearPendingOffShelf();
    }

    return { closeOffShelfWarning: true };
  }

  closeOffShelfWarning(): ListUiResult {
    this.clearPendingOffShelf();

    return { closeOffShelfWarning: true };
  }

  closeOnShelfWarning(): ListUiResult {
    return { closeOnShelfWarning: true };
  }

  // ===== 純資料 helper =====

  mapDemands(demands: DisasterDemand[]): DisasterListItem[] {
    const displayStatus: Record<DisasterStatus, DisplayStatus> = {
      上架: '已上架',
      隱藏: '隱藏中',
      下架: '已下架',
    };

    return demands.map((item) => {
      const checkedItem = this.checkNaturalOffShelf(item);

      return {
        ...checkedItem,
        selected: false,
        displayStatus: displayStatus[checkedItem.status],
        displayCreatedAt: checkedItem.createdAt ? new Date(checkedItem.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
        displayPublishedAt: checkedItem.publishedAt ? new Date(checkedItem.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',
        displayOffShelfAt: checkedItem.expectedOffShelfAt ? new Date(checkedItem.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
        remaining: checkedItem.remaining ?? checkedItem.amount ?? 0,
        category: checkedItem.category ?? '其他',
      };
    });
  }

  async loadMessageCounts(demands: DisasterListItem[]): Promise<DisasterListItem[]> {
    const result = await Promise.all(
      demands.map(async (item) => {
        if (item.id == null) {
          return {
            ...item,
            messageCount: 0,
          };
        }

        const messageCount = await this.disasterCommentService.getCommentCount(item.id);

        return {
          ...item,
          messageCount,
        };
      })
    );

    return result;
  }

  /**
   * 檢查需求是否已經超過預計下架時間
   */
  checkNaturalOffShelf(item: DisasterDemand): DisasterDemand {
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

      // 同步更新 Service 中的資料
      this.disasterDemandService.updateDemand(item);
    }

    return item;
  }

  /**
   * 套用搜尋與篩選條件
   */
  filterDemands(demands: DisasterListItem[], searchTerm: string, selectedFilters: SupplyFilterState): DisasterListItem[] {
    return demands.filter((item) => {
      // 搜尋
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();

        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;

        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      // 狀態篩選
      if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      // 優先度篩選
      if (selectedFilters.priority.length > 0 && !selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      // 剩餘需求篩選
      if (selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      // 類別篩選
      if (selectedFilters.category.length > 0 && (!item.category || !selectedFilters.category.includes(item.category))) {
        return false;
      }

      // 留言狀態篩選
      if (selectedFilters.messageStatus.length > 0) {
        // 留言篩選只套用在「已上架」
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = selectedFilters.messageStatus.includes('未回覆');

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

  /**
   * 套用排序
   */
  sortDemands(demands: DisasterListItem[], selectedSort: SortType, sortAscending: boolean): DisasterListItem[] {
    return [...demands].sort((a, b) => {
      let result = 0;

      if (selectedSort === 'serialNo') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      if (selectedSort === 'createdAt') {
        result = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      }

      if (selectedSort === 'publishedAt') {
        result = new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
      }

      if (selectedSort === 'expectedOffShelfAt') {
        result = new Date(a.expectedOffShelfAt ?? 0).getTime() - new Date(b.expectedOffShelfAt ?? 0).getTime();
      }

      if (selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      return sortAscending ? result : -result;
    });
  }

  /**
   * 計算分頁資料
   */
  getPaginationData(
    filteredDemands: DisasterListItem[],
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    pageNumbers: number[];
    pagedDemands: DisasterListItem[];
    currentPage: number;
    selectAll: boolean;
  } {
    const totalPages = Math.ceil(filteredDemands.length / pageSize) || 1;

    let adjustedCurrentPage = currentPage;

    if (adjustedCurrentPage > totalPages) {
      adjustedCurrentPage = totalPages;
    }

    const pageNumbers = Array.from(
      {
        length: totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (adjustedCurrentPage - 1) * pageSize;

    const pagedDemands = [...filteredDemands.slice(startIndex, startIndex + pageSize)];

    const selectAll = pagedDemands.length > 0 && pagedDemands.every((item) => item.selected);

    return {
      totalPages,
      pageNumbers,
      pagedDemands,
      currentPage: adjustedCurrentPage,
      selectAll,
    };
  }

  /**
   * 計算預計下架日期
   */
  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
    return calculateExpectedOffShelfAt(publishedDate, priority, DISASTER_OFF_SHELF_DAYS);
  }

  /**
   * 套用需求狀態變更
   */
  async applyStatusChange(item: DisasterListItem): Promise<void> {
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.id === item.id);

    const originalStatus = originalItem?.status;

    const status: DisasterStatus = item.displayStatus === '已上架' ? '上架' : '隱藏';

    const now = new Date();

    if (status === '上架') {
      if (originalStatus !== '上架') {
        item.publishedAt = now.toISOString();
        item.createdAt ??= now.toISOString();
      }

      if (item.publishedAt) {
        item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      }

      item.status = '上架';
      item.offShelfReason = undefined;
      item.displayStatus = '已上架';

      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';

      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
    } else {
      item.status = '隱藏';
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;
      item.displayStatus = '隱藏中';
      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
    }

    try {
      await this.disasterDemandService.updateDemand(item);
    } catch (error) {
      console.error('狀態更新失敗：', error);
    }
  }

  // ===== private =====

  private clearPendingOffShelf(): void {
    this.pendingOffShelfItem = undefined;
  }

  private isValidDbId(id: number | undefined): id is number {
    return id != null && Number.isInteger(Number(id)) && Number(id) > 0;
  }

  private createEmptyFilters(): SupplyFilterState {
    return {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }
}
