import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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

type VolunteerListItem = VolunteerDemand & {
  selected: boolean;
  displayStatus: DisplayVolunteerStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
  category: string;
};

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
export class VolunteerListComponent implements OnInit, AfterViewInit, OnDestroy {
  demands: VolunteerListItem[] = [];
  filteredDemands: VolunteerListItem[] = [];
  pagedDemands: VolunteerListItem[] = [];

  private demandChangedSubscription?: Subscription;

  selectAll = false;
  isLoading = false;
  isRestoringScroll = false;

  searchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  private readonly scrollPositionKey = 'agency-volunteer-workspace-scroll';

  private readonly pagePositionKey = 'agency-volunteer-workspace-page';

  selectedSort: SortType = 'id';
  sortAscending = true;
  private userHasSorted = true;

  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  pendingOffShelfItem?: VolunteerListItem;

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
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    history.scrollRestoration = 'manual';

    this.demandChangedSubscription = this.volunteerDemandService.demandChanged$.subscribe(() => {
      void this.loadDemands();
    });
  }

  ngOnInit(): void {
    const restoreListPosition = sessionStorage.getItem('restore-agency-volunteer-list');

    if (restoreListPosition === 'true') {
      const savedPage = sessionStorage.getItem(this.pagePositionKey);

      if (savedPage) {
        const page = Number(savedPage);

        if (page >= 1) {
          this.currentPage = page;
        }
      }

      sessionStorage.removeItem('restore-agency-volunteer-list');
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
    this.router.navigate(['/agency/volunteer-form']);
  }

  goToDetail(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[VolunteerListComponent] 無法前往詳細頁，資料庫 id 不正確：', id);

      return;
    }

    this.saveListPosition();

    sessionStorage.setItem('restore-agency-volunteer-list', 'true');

    this.router.navigate(['/agency/volunteer-detail', id]);
  }

  goToEdit(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[VolunteerListComponent] 無法前往編輯頁，資料庫 id 不正確：', id);

      return;
    }

    this.saveListPosition();

    sessionStorage.setItem('restore-agency-volunteer-list', 'true');

    this.router.navigate(['/agency/volunteer-edit', id]);
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
    this.isLoading = true;

    try {
      await this.volunteerDemandService.reload();

      const displayStatus: Record<VolunteerStatus, DisplayVolunteerStatus> = {
        上架: '已上架',
        隱藏: '隱藏中',
        下架: '已下架',
      };

      this.demands = this.volunteerDemandService.getDemands().map((item) => ({
        ...item,

        selected: false,

        displayStatus: displayStatus[item.status as VolunteerStatus],

        displayCreatedAt:
          item.status === '隱藏' ? '尚未發布' : item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布',

        displayPublishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',

        displayOffShelfAt: item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',

        category: item.type ?? '其他',
      }));

      this.applyFilters(false);
    } catch (error) {
      console.error('載入志工需求失敗：', error);

      this.demands = [];
      this.filteredDemands = [];
      this.pagedDemands = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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

    localStorage.setItem('editVolunteerDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    sessionStorage.setItem('restore-agency-volunteer-list', 'true');

    this.router.navigate(['/agency/volunteer-batch-edit']);
  }

  onFilterApply(filters: VolunteerFilterState): void {
    this.selectedFilters = filters;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      type: [],
      messageStatus: [],
    };

    this.applyFilters();
  }

  applyFilters(resetPage = true): void {
    this.filteredDemands = this.demands.filter((item) => {
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim().toLowerCase();

        const matchType = item.type ? item.type.toLowerCase().includes(term) : false;

        if (!matchType) {
          return false;
        }
      }

      if (this.selectedFilters.status.length > 0 && !this.selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      if (this.selectedFilters.priority.length > 0 && !this.selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      if (this.selectedFilters.type.length > 0 && (!item.type || !this.selectedFilters.type.includes(item.type))) {
        return false;
      }

      if (this.selectedFilters.messageStatus.length > 0) {
        const hasMessage = (item.messageCount ?? 0) > 0;

        const wantsReplied = this.selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = this.selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsNotReplied && !hasMessage) {
          return false;
        }

        if (wantsNotReplied && !wantsReplied && hasMessage) {
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

  private getCreatedAtTime(demand: VolunteerDemand): number {
    if (demand.status === '隱藏' || !demand.createdAt) {
      return Number.POSITIVE_INFINITY;
    }

    const timestamp = new Date(demand.createdAt).getTime();

    return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
  }

  applySort(): void {
    this.filteredDemands = [...this.filteredDemands].sort((a, b) => {
      let result = 0;

      if (this.selectedSort === 'id') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      if (this.selectedSort === 'createdAt') {
        result = this.getCreatedAtTime(a) - this.getCreatedAtTime(b);
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

      if (this.selectedSort === 'people') {
        result = Number(a.people ?? 0) - Number(b.people ?? 0);
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
      (_, index) => index + 1
    );

    const startIndex = (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.pagedDemands = [...this.filteredDemands.slice(startIndex, endIndex)];

    this.selectAll = this.pagedDemands.length > 0 && this.pagedDemands.every((item) => item.selected);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openDeleteModal(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[VolunteerListComponent] 無法刪除，資料庫 id 不正確：', id);

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

    await this.loadDemands();
  }

  changeStatus(item: VolunteerListItem, event: Event): void {
    const select = event.target as HTMLSelectElement;

    const newStatus = select.value as DisplayVolunteerStatus;

    const originalItem = this.volunteerDemandService.getDemands().find((demand) => demand.id === item.id);

    if (newStatus === '已下架') {
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

    item.expectedOffShelfAt = now.toISOString();

    item.displayStatus = '已下架';

    item.displayOffShelfAt = now.toLocaleDateString('zh-TW');

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    try {
      await this.volunteerDemandService.updateDemand(item);

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
    item.displayStatus = '隱藏中';
    item.expectedOffShelfAt = undefined;
    item.displayPublishedAt = '尚未上架';
    item.displayOffShelfAt = '—';

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    try {
      await this.volunteerDemandService.updateDemand(item);

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

  private async applyStatusChange(item: VolunteerListItem): Promise<void> {
    const originalItem = this.volunteerDemandService.getDemands().find((demand) => demand.id === item.id);

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
        break;
    }

    const now = new Date();

    if (status === '上架') {
      if (originalStatus === '下架') {
        item.displayStatus = '已下架';
        this.showOnShelfWarning = true;

        return;
      }

      if (originalStatus !== '上架') {
        item.publishedAt = now.toISOString();

        if (!item.createdAt) {
          item.createdAt = now.toISOString();
        }
      } else if (originalItem?.publishedAt) {
        item.publishedAt = originalItem.publishedAt;
      }

      if (item.publishedAt) {
        item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      }

      item.status = '上架';
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

    item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未建立';

    try {
      await this.volunteerDemandService.updateDemand(item);

      await this.loadDemands();
    } catch (error) {
      console.error('狀態更新失敗：', error);
    }
  }

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
