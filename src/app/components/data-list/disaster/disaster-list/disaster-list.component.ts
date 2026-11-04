import { ChangeDetectorRef, Component, HostListener, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DisasterDemand, DisplayStatus } from '../../../../models/agency/disaster-demand';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { SupplySearchBarComponent } from '../../../search-bar/supply-search-bar/supply-search-bar.component';
import { SupplyFilterComponent, SupplyFilterState } from '../../../filter/supply-filter/supply-filter.component';
import { SupplySortBarComponent, SortType } from '../../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { DisasterListLogic, DisasterListItem } from '../../../logic/disaster/disaster-list-logic';
import { ListUiResult } from '../../../../core/ui/list-ui-result';
import { UiNoticeService } from '../../../../core/ui/ui-notice.service';

interface ApplyUiContext {
  /** 呼叫 Logic 前記錄的 scrollY（配合 preserveScrollY）。 */
  scrollY?: number;
  /** 觸發事件的 select（配合 selectValueRestore）。 */
  select?: HTMLSelectElement;
}

/** 薄 Facade：狀態與 domain 操作由 DisasterListLogic 持有，這裡只套用 UI 意圖。 */
@Component({
  selector: 'app-disaster-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ConfirmModalComponent,
    PaginationComponent,
    SupplySearchBarComponent,
    SupplySortBarComponent,
    SupplyFilterComponent,
    SupplyLoadingComponent,
  ],
  providers: [DisasterListLogic],
  templateUrl: './disaster-list.component.html',
  styleUrls: ['./disaster-list-A.component.scss'],
})
export class DisasterListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly logic = inject(DisasterListLogic);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notices = inject(UiNoticeService);

  private demandChangedSubscription?: Subscription;

  // ===== 純 UI 旗標（由 ListUiResult 驅動） =====
  isRestoringScroll = false;
  showDeleteModal = false;
  showOffShelfWarning = false;
  showOnShelfWarning = false;

  constructor() {
    history.scrollRestoration = 'manual';

    this.demandChangedSubscription = this.logic.demandChanged$.subscribe(() => {
      void this.loadDemands(false);
    });
  }

  // ===== 模板用 VM（委派 Logic） =====
  get demands(): DisasterListItem[] {
    return this.logic.demands;
  }
  get filteredDemands(): DisasterListItem[] {
    return this.logic.filteredDemands;
  }
  get pagedDemands(): DisasterListItem[] {
    return this.logic.pagedDemands;
  }
  get isLoading(): boolean {
    return this.logic.isLoading;
  }
  get selectAll(): boolean {
    return this.logic.selectAll;
  }
  set selectAll(value: boolean) {
    this.logic.selectAll = value;
  }
  get searchTerm(): string {
    return this.logic.searchTerm;
  }
  get currentPage(): number {
    return this.logic.currentPage;
  }
  get pageSize(): number {
    return this.logic.pageSize;
  }
  get totalPages(): number {
    return this.logic.totalPages;
  }
  get pageNumbers(): number[] {
    return this.logic.pageNumbers;
  }
  get selectedSort(): SortType {
    return this.logic.selectedSort;
  }
  get sortAscending(): boolean {
    return this.logic.sortAscending;
  }
  get selectedFilters(): SupplyFilterState {
    return this.logic.selectedFilters;
  }
  get statusOptions(): DisplayStatus[] {
    return this.logic.statusOptions;
  }
  get priorityOptions(): DisasterDemand['priority'][] {
    return this.logic.priorityOptions;
  }
  get categoryOptions(): NonNullable<DisasterDemand['category']>[] {
    return this.logic.categoryOptions;
  }
  get messageOptions(): string[] {
    return this.logic.messageOptions;
  }
  get deleteIds(): number[] {
    return this.logic.deleteIds;
  }
  get deleteType(): 'single' | 'batch' {
    return this.logic.deleteType;
  }
  get pendingOffShelfItem(): DisasterListItem | undefined {
    return this.logic.pendingOffShelfItem;
  }

  // ===== 生命週期 =====
  ngOnInit(): void {
    this.logic.initFromSession();

    void this.loadDemands();
  }

  ngAfterViewInit(): void {
    this.applyUi(this.logic.getRestoreScrollResult());
  }

  ngOnDestroy(): void {
    this.demandChangedSubscription?.unsubscribe();
  }

  // ===== 導覽 =====
  goToAddDemand(): void {
    this.applyUi(this.logic.resolveAddNavigation());
  }

  goToDetail(id: number | undefined): void {
    this.applyUi(this.logic.resolveDetailNavigation(id));
  }

  goToEdit(id: number | undefined): void {
    const result = this.logic.resolveEditNavigation(id);

    if (result.navigateTo) {
      this.prepareListRestore();
    }

    this.applyUi(result);
  }

  saveListPosition(): void {
    this.logic.saveListPosition(window.scrollY);
  }

  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    this.saveListPosition();
  }

  // ===== 載入／搜尋／篩選／排序／分頁 =====
  async loadDemands(showLoading = true): Promise<void> {
    const result = await this.logic.loadDemands(showLoading);

    this.applyUi(result);
  }

  onSearchChange(value: string): void {
    this.logic.onSearchChange(value);
  }

  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }): void {
    const scrollY = window.scrollY;

    this.applyUi(this.logic.onSortChange(event), { scrollY });
  }

  onFilterApply(filters: SupplyFilterState): void {
    this.logic.onFilterApply(filters);
  }

  resetFilters(): void {
    this.logic.resetFilters();
  }

  applyFilters(resetPage = true): void {
    this.logic.applyFilters(resetPage);
  }

  goToPage(page: number): void {
    this.applyUi(this.logic.goToPage(page));
  }

  // ===== 選取／批次 =====
  toggleAll(): void {
    this.logic.toggleAll();
  }

  hasSelected(): boolean {
    return this.logic.hasSelected();
  }

  editSelected(): void {
    const result = this.logic.prepareBatchEdit();

    if (result.navigateTo) {
      this.prepareListRestore();
    }

    this.applyUi(result);
  }

  // ===== 刪除 =====
  openDeleteModal(serialNo: number): void {
    this.applyUi(this.logic.openDeleteModal(serialNo));
  }

  openBatchDeleteModal(): void {
    this.applyUi(this.logic.openBatchDeleteModal());
  }

  closeDeleteModal(): void {
    this.applyUi(this.logic.closeDeleteModal());
  }

  async confirmDelete(): Promise<void> {
    const result = await this.logic.confirmDelete((intermediate) => this.applyUi(intermediate));

    this.applyUi(result);
  }

  // ===== 狀態變更／下架警告 =====
  changeStatus(item: DisasterListItem, event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.applyUi(this.logic.changeStatus(item, select.value as DisplayStatus), { select });
  }

  async confirmManualOffShelf(): Promise<void> {
    this.applyUi(await this.logic.confirmManualOffShelf());
  }

  cancelManualOffShelf(): void {
    this.applyUi(this.logic.cancelManualOffShelf());
  }

  async hideInsteadOfOffShelf(): Promise<void> {
    this.applyUi(await this.logic.hideInsteadOfOffShelf());
  }

  closeOffShelfWarning(): void {
    this.applyUi(this.logic.closeOffShelfWarning());
  }

  closeOnShelfWarning(): void {
    this.applyUi(this.logic.closeOnShelfWarning());
  }

  // ===== UI intent 套用 =====
  /** 離開列表前記錄位置，讓返回時能還原。 */
  private prepareListRestore(): void {
    this.saveListPosition();
    this.logic.markRestoreListPosition();
  }

  private applyUi(result: ListUiResult, context: ApplyUiContext = {}): void {
    if (result.openDeleteModal) {
      this.showDeleteModal = true;
    }
    if (result.closeDeleteModal) {
      this.showDeleteModal = false;
    }
    if (result.openOffShelfWarning) {
      this.showOffShelfWarning = true;
    }
    if (result.closeOffShelfWarning) {
      this.showOffShelfWarning = false;
    }
    if (result.openOnShelfWarning) {
      this.showOnShelfWarning = true;
    }
    if (result.closeOnShelfWarning) {
      this.showOnShelfWarning = false;
    }

    if (result.notice) {
      void this.notices.alert(result.notice);
    }

    if (result.selectValueRestore !== undefined && context.select) {
      const select = context.select;
      const value = result.selectValueRestore;

      setTimeout(() => {
        select.value = value;
      });
    }

    if (result.scrollTop) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }

    if (result.preserveScrollY && context.scrollY !== undefined) {
      const scrollY = context.scrollY;

      setTimeout(() => {
        window.scrollTo({
          top: scrollY,
          behavior: 'instant',
        });
      }, 0);
    }

    if (result.restoreScrollY != null) {
      this.restoreScroll(result.restoreScrollY);
    }

    if (result.navigateTo) {
      void this.router.navigate(result.navigateTo);
    }

    this.cdr.markForCheck();
  }

  private restoreScroll(scrollY: number): void {
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
}
