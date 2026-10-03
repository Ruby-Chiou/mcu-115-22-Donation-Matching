import { ChangeDetectorRef, Component, HostListener, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand, DisplayStatus } from '../../../../models/agency/disaster-demand';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { SupplyLoadingComponent } from '../../../../components/loading/supply-loading/supply-loading.component';
import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplySearchBarComponent } from '../../../search-bar/supply-search-bar/supply-search-bar.component';
import { SupplyFilterComponent, SupplyFilterState } from '../../../filter/supply-filter/supply-filter.component';
import { SupplySortBarComponent, SortType } from '../../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { DisasterListLogic, DisasterListItem } from '../../../logic/disaster/disaster-list-logic';

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
    SupplyLoadingComponent,
  ],
  templateUrl: './disaster-list.component.html',
  styleUrls: ['./disaster-list-A.component.scss'],
})
export class DisasterListComponent implements OnInit, AfterViewInit, OnDestroy {
  demands: DisasterListItem[] = [];
  filteredDemands: DisasterListItem[] = [];
  pagedDemands: DisasterListItem[] = [];

  private demandChangedSubscription?: Subscription;
  private readonly logic: DisasterListLogic;

  selectAll = false;
  isRestoringScroll = false;
  isLoading = false;
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  private readonly scrollPositionKey = 'agency-disaster-workspace-scroll';
  private readonly pagePositionKey = 'agency-disaster-workspace-page';

  selectedSort: SortType = 'serialNo';
  sortAscending = true;
  private userHasSorted = true;

  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  showOffShelfWarning = false;
  showOnShelfWarning = false;
  pendingOffShelfItem?: DisasterListItem;

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
    private readonly disasterDemandService: DisasterDemandService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.logic = new DisasterListLogic();

    history.scrollRestoration = 'manual';

    this.demandChangedSubscription = this.disasterDemandService.demandChanged$.subscribe(() => {
      void this.loadDemands(false);
    });
  }

  ngOnInit(): void {
    const restoreListPosition = sessionStorage.getItem('restore-agency-disaster-list');

    if (restoreListPosition === 'true') {
      const savedPage = sessionStorage.getItem(this.pagePositionKey);

      if (savedPage) {
        const page = Number(savedPage);

        if (page >= 1) {
          this.currentPage = page;
        }
      }

      sessionStorage.removeItem('restore-agency-disaster-list');
    } else {
      this.currentPage = 1;

      sessionStorage.removeItem(this.pagePositionKey);
      sessionStorage.removeItem(this.scrollPositionKey);
    }

    void this.loadDemands();
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

  ngOnDestroy(): void {
    this.demandChangedSubscription?.unsubscribe();
  }

  goToAddDemand(): void {
    this.router.navigate(['/agency/supply-form']);
  }

  goToDetail(serialNo: number | undefined): void {
    if (serialNo == null || !Number.isInteger(Number(serialNo))) {
      console.error('無法前往災害物資詳細頁，需求編號不正確：', serialNo);
      return;
    }

    this.router.navigate(['/agency/supply-detail', serialNo]);
  }

  goToEdit(serialNo: number): void {
    this.saveListPosition();
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/supply-edit', serialNo]);
  }

  saveListPosition(): void {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));
    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    this.saveListPosition();
  }

  async loadDemands(showLoading = true): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (showLoading) {
      this.isLoading = true;
    }

    try {
      await this.disasterDemandService.reload();

      this.demands = this.logic.mapDemands(this.disasterDemandService.getDemands(), this.disasterDemandService);
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
      this.cdr.markForCheck();
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }): void {
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
    sessionStorage.setItem('restore-agency-disaster-list', 'true');
    this.router.navigate(['/agency/supply-batch-edit']);
  }

  onFilterApply(filters: SupplyFilterState): void {
    this.selectedFilters = filters;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
    this.applyFilters();
  }

  applyFilters(resetPage = true): void {
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
    this.filteredDemands = this.logic.sortDemands(this.filteredDemands, this.selectedSort, this.sortAscending);
    this.updatePagination();
  }

  updatePagination(): void {
    const result = this.logic.getPaginationData(this.filteredDemands, this.currentPage, this.pageSize);

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

  openDeleteModal(serialNo: number): void {
    this.deleteIds = [serialNo];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  openBatchDeleteModal(): void {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id != null).map((item) => item.id as number);
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
    await this.loadDemands();
  }

  changeStatus(item: DisasterListItem, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as DisplayStatus;
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.id === item.id);

    // 選擇「已下架」
    if (newStatus === '已下架') {
      item.displayStatus = originalItem?.status === '上架' ? '已上架' : originalItem?.status === '下架' ? '已下架' : '隱藏中';

      setTimeout(() => {
        select.value = item.displayStatus;
      });

      this.pendingOffShelfItem = item;
      this.showOffShelfWarning = true;
      return;
    }

    if (newStatus === '已上架' && item.status === '下架') {
      const offShelfReason = item.offShelfReason ?? originalItem?.offShelfReason;

      // 只有「手動下架」不能重新上架
      if (offShelfReason === 'manual') {
        item.displayStatus = '已下架';

        setTimeout(() => {
          select.value = '已下架';
        });

        this.showOnShelfWarning = true;
        return;
      }

      // 自然下架可以重新上架
      item.displayStatus = '已上架';
      void this.applyStatusChange(item);
      return;
    }

    // 隱藏中 → 其他狀態
    item.displayStatus = newStatus;
    void this.applyStatusChange(item);
  }

  async confirmManualOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
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
      this.closeOffShelfWarning();
    }
  }

  cancelManualOffShelf(): void {
    this.closeOffShelfWarning();
  }

  async hideInsteadOfOffShelf(): Promise<void> {
    if (!this.pendingOffShelfItem) {
      return;
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
      this.closeOffShelfWarning();
    }
  }

  closeOffShelfWarning(): void {
    this.showOffShelfWarning = false;
    this.pendingOffShelfItem = undefined;
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;
  }

  private async applyStatusChange(item: DisasterListItem): Promise<void> {
    await this.logic.applyStatusChange(item, this.disasterDemandService);
  }
}
