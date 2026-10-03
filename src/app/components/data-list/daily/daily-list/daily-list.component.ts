import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subject, takeUntil, timeout, catchError, of } from 'rxjs';
import { DailyDemand, DailyDisplayStatus } from '../../../../models/agency/daily-demand';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyListLogic } from '../../../logic/daily/daily-list-logic';
import type { DailyFilterState, DailyListItem, ReceiveMethod } from '../../../logic/daily/daily-list-logic';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { DailySearchBarComponent } from '../../../search-bar/daily-search-bar/daily-search-bar.component';
import { DailyFilterComponent } from '../../../filter/daily-filter/daily-filter.component';
import { DailySortBarComponent, SortType } from '../../../sort-bar/daily-sort-bar/daily-sort-bar.component';
import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

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
  private readonly logic = new DailyListLogic();
  demands: DailyListItem[] = [];
  filteredDemands: DailyListItem[] = [];
  pagedDemands: DailyListItem[] = [];
  selectAll = false;
  isLoading = false;
  private readonly destroy$ = new Subject<void>();
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];
  private readonly scrollPositionKey = 'agency-daily-workspace-scroll';
  private readonly pagePositionKey = 'agency-daily-workspace-page';
  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  private userHasSorted = false;
  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';
  showFilterModal = false;
  showOffShelfWarning = false;
  showOnShelfWarning = false;
  pendingOffShelfItem?: DailyListItem;
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
    '其他',
  ];

  messageOptions: string[] = ['已回覆', '未回覆'];

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

  ngOnInit(): void {
    const restoreListPosition = sessionStorage.getItem('restore-agency-daily-list');
    if (restoreListPosition === 'true') {
      const savedPage = sessionStorage.getItem(this.pagePositionKey);
      if (savedPage) {
        const page = Number(savedPage);
        if (page >= 1) {
          this.currentPage = page;
        }
      }

      sessionStorage.removeItem('restore-agency-daily-list');
    } else {
      this.currentPage = 1;
      sessionStorage.removeItem(this.pagePositionKey);
      sessionStorage.removeItem(this.scrollPositionKey);
    }

    void this.loadDemands();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        console.log('Router NavigationEnd：', event.urlAfterRedirects);
        const url = event.urlAfterRedirects;

        if (url === '/agency/daily' || url.startsWith('/agency/daily?')) {
          void this.loadDemands();
        }
      });
  }

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

  goToAddDemand(): void {
    this.router.navigate(['/agency/daily-form']);
  }

  goToDetail(serialNo: number | undefined): void {
    if (serialNo == null || !Number.isInteger(Number(serialNo))) {
      console.error('無法前往日常需求詳細頁，需求編號不正確：', serialNo);
      return;
    }
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-daily-list', 'true');
    this.router.navigate(['/agency/daily-detail', serialNo]);
  }

  goToEdit(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListComponent] 無法前往編輯頁，資料庫 id 不正確：', id);
      return;
    }
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-daily-list', 'true');
    this.router.navigate(['/agency/daily-edit', id]);
  }

  saveListPosition(): void {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

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

  async loadDemands(): Promise<void> {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();

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
        .subscribe((data) => {
          this.demands = this.logic.mapDemands(data, (item) => this.dailyDemandService.updateDemand(item));
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

  applyFilterFromModal(): void {
    this.applyFilters();
    this.showFilterModal = false;
  }

  applyFilters(resetPage: boolean = true): void {
    this.filteredDemands = this.logic.filterDemands(this.demands, this.searchTerm, this.selectedFilters);

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
    this.logic.sortDemands(this.filteredDemands, this.selectedSort, this.sortAscending);
    this.updatePagination();
  }

  updatePagination(): void {
    const result = this.logic.getPaginationData(this.filteredDemands, this.currentPage, this.pageSize);
    this.currentPage = result.currentPage;
    this.totalPages = result.totalPages;
    this.pageNumbers = result.pageNumbers;
    this.pagedDemands = result.pagedDemands;
    this.selectAll = result.selectAll;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
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

  openDeleteModal(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyListComponent] 無法刪除，資料庫 id 不正確：', id);

      return;
    }
    this.deleteIds = [id];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  openBatchDeleteModal(): void {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => Number(item.id));
    if (this.deleteIds.length === 0) {
      alert('請先選擇要刪除的需求');
      return;
    }
    this.deleteType = 'batch';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  async onDeleted(): Promise<void> {
    this.showDeleteModal = false;
    this.deleteIds = [];
    this.selectAll = false;
    this.cdr.detectChanges();
    await this.loadDemands();
    this.cdr.detectChanges();
  }

  async changeStatus(item: DailyListItem, newStatus: DailyDisplayStatus): Promise<void> {
    const originalItem = this.dailyDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);
    const originalStatus = originalItem?.status;

    if (newStatus === '已上架') {
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        this.showOnShelfWarning = true;
        return;
      }

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

      item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      item.status = '上架';
      item.offShelfReason = undefined;
      item.displayStatus = '已上架';
      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';
      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

      this.dailyDemandService.updateDemand(item);
      this.refreshItemReference(item);

      return;
    }

    if (newStatus === '已下架') {
      if (originalStatus === '下架') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return;
      }

      this.pendingOffShelfItem = item;
      this.refreshItemReference(item);
      this.showOffShelfWarning = true;

      return;
    }

    if (newStatus === '隱藏中') {
      if (originalStatus === '下架' && originalItem?.offShelfReason === 'manual') {
        item.status = '下架';
        item.displayStatus = '已下架';
        this.refreshItemReference(item);
        return;
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

      return;
    }
  }

  private refreshItemReference(item: DailyListItem): void {
    const demandIndex = this.demands.findIndex((d) => d.serialNo === item.serialNo);

    if (demandIndex !== -1) {
      this.demands[demandIndex] = {
        ...item,
      };
    }

    const filteredIndex = this.filteredDemands.findIndex((d) => d.serialNo === item.serialNo);

    if (filteredIndex !== -1) {
      this.filteredDemands[filteredIndex] = {
        ...item,
      };
    }

    const pagedIndex = this.pagedDemands.findIndex((d) => d.serialNo === item.serialNo);

    if (pagedIndex !== -1) {
      this.pagedDemands[pagedIndex] = {
        ...item,
      };
    }
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    return this.logic.calculateExpectedOffShelfDate(publishedDate, priority);
  }

  async confirmManualOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
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
      this.closeOffShelfWarning();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('下架更新失敗：', error);

      alert('下架失敗，請稍後再試。');

      this.closeOffShelfWarning();
      this.loadDemands();
    }
  }

  cancelManualOffShelf(): void {
    this.closeOffShelfWarning();
  }

  async hideInsteadOfOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
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
      this.closeOffShelfWarning();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('隱藏失敗：', error);

      alert('隱藏失敗，請稍後再試。');

      this.closeOffShelfWarning();
      this.loadDemands();
    }
  }

  closeOffShelfWarning(): void {
    this.showOffShelfWarning = false;
    this.pendingOffShelfItem = undefined;
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
