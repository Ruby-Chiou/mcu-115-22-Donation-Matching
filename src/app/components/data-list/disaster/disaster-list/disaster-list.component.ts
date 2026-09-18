import { ChangeDetectorRef, Component, HostListener, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand, DisasterStatus, DisplayStatus } from '../../../../models/agency/disaster-demand';

import { PaginationComponent } from '../../../pagination/pagination.component';
import { SupplyLoadingComponent } from '../../../../components/loading/supply-loading/supply-loading.component';
import { SupplyDeleteComponent } from '../../../modal/delete/supply-delete/supply-delete.component';
import { SupplySearchBarComponent } from '../../../search-bar/supply-search-bar/supply-search-bar.component';
import { SupplyFilterComponent, SupplyFilterState } from '../../../filter/supply-filter/supply-filter.component';
import { SupplySortBarComponent, SortType } from '../../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';

type DisasterListItem = DisasterDemand & {
  selected: boolean;
  displayStatus: DisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

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
    history.scrollRestoration = 'manual';
    this.demandChangedSubscription = this.disasterDemandService.demandChanged$.subscribe(() => {
      void this.loadDemands();
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

  goToDetail(id: number | undefined): void {
    if (id == null || !Number.isInteger(Number(id))) {
      console.error('無法前往災害物資詳細頁，資料庫 id 不正確：', id);

      return;
    }

    this.router.navigate(['/agency/supply-detail', id]);
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

  async loadDemands(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      await this.disasterDemandService.reload();

      const displayStatus: Record<DisasterStatus, DisplayStatus> = {
        上架: '已上架',
        隱藏: '隱藏中',
        下架: '已下架',
      };

      this.demands = this.disasterDemandService.getDemands().map((item) => {
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

      this.filteredDemands = [...this.demands];

      this.currentPage = 1;

      this.updatePagination();
    } catch (error) {
      console.error('載入物資需求失敗：', error);

      this.demands = [];
      this.filteredDemands = [];
      this.pagedDemands = [];
    } finally {
      this.isLoading = false;

      this.cdr.markForCheck();
    }
  }

  private checkNaturalOffShelf(item: DisasterDemand): DisasterDemand {
    if (item.status !== '上架' || !item.expectedOffShelfAt) {
      return item;
    }

    if (new Date() < new Date(item.expectedOffShelfAt)) {
      return item;
    }

    const updatedItem = {
      ...item,
      status: '下架' as DisasterStatus,
      offShelfReason: 'natural' as const,
    };

    void this.disasterDemandService.updateDemand(updatedItem);

    return updatedItem;
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
    this.filteredDemands = this.demands.filter((item) => {
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim().toLowerCase();
        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;
        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      if (this.selectedFilters.status.length > 0 && !this.selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      if (this.selectedFilters.priority.length > 0 && !this.selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      if (this.selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      if (this.selectedFilters.category.length > 0 && (!item.category || !this.selectedFilters.category.includes(item.category))) {
        return false;
      }

      if (this.selectedFilters.messageStatus.length > 0) {
        const hasMsg = (item.messageCount ?? 0) > 0;
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

  applySort(): void {
    this.filteredDemands = [...this.filteredDemands].sort((a, b) => {
      let result = 0;

      if (this.selectedSort === 'serialNo') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      if (this.selectedSort === 'createdAt') {
        result = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      }

      if (this.selectedSort === 'publishedAt') {
        result = new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
      }

      if (this.selectedSort === 'expectedOffShelfAt') {
        result = new Date(a.expectedOffShelfAt ?? 0).getTime() - new Date(b.expectedOffShelfAt ?? 0).getTime();
      }

      if (this.selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (this.selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      return this.sortAscending ? result : -result;
    });

    this.updatePagination();
  }

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

    this.pagedDemands = [...this.filteredDemands.slice(startIndex, startIndex + this.pageSize)];

    this.selectAll = this.pagedDemands.length > 0 && this.pagedDemands.every((item) => item.selected);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openDeleteModal(serialNo: number): void {
    this.deleteIds = [serialNo];
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  openBatchDeleteModal(): void {
    this.deleteIds = this.filteredDemands
      .filter((item) => item.selected && item.serialNo !== undefined)
      .map((item) => item.serialNo as number);
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

    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    if (newStatus === '已下架') {
      item.displayStatus = originalItem?.status === '上架' ? '已上架' : originalItem?.status === '下架' ? '已下架' : '隱藏中';

      setTimeout(() => {
        select.value = item.displayStatus;
      });

      this.pendingOffShelfItem = item;
      this.showOffShelfWarning = true;
      return;
    }

    if (newStatus === '已上架' && originalItem?.status === '下架') {
      item.displayStatus = '已下架';
      setTimeout(() => {
        select.value = '已下架';
      });
      this.showOnShelfWarning = true;
      return;
    }

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
      await this.loadDemands();
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
      await this.loadDemands();
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
    const originalItem = this.disasterDemandService.getDemands().find((demand) => demand.serialNo === item.serialNo);

    const originalStatus = originalItem?.status;

    let status: DisasterStatus = item.displayStatus === '已上架' ? '上架' : '隱藏';

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
      await this.loadDemands();
    } catch (error) {
      console.error('狀態更新失敗：', error);
    }
  }

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
