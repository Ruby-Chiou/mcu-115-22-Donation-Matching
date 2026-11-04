import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisplayHelperStatus } from '../../../../models/agency/helper-demand';
import { ListUiResult } from '../../../../core/ui/list-ui-result';
import { UiNoticeService } from '../../../../core/ui/ui-notice.service';
import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { HelperSearchBarComponent } from '../../../search-bar/helper-search-bar/helper-search-bar.component';
import { HelperFilterComponent, HelperFilterState } from '../../../filter/helper-filter/helper-filter.component';
import { HelperSortBarComponent, SortType } from '../../../sort-bar/helper-sort-bar/helper-sort-bar.component';
import { HelperListItem, HelperListLogic } from '../../../logic/disaster/helper-list.logic';

@Component({
  selector: 'app-helper-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PaginationComponent,
    ConfirmModalComponent,
    HelperSearchBarComponent,
    HelperSortBarComponent,
    HelperFilterComponent,
    SupplyLoadingComponent,
  ],
  providers: [HelperListLogic],
  templateUrl: './helper-list.component.html',
  styleUrl: './helper-list.component.scss',
})
export class HelperListComponent implements OnInit, AfterViewInit {
  private readonly logic = inject(HelperListLogic);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notices = inject(UiNoticeService);

  isRestoringScroll = false;

  constructor() {
    history.scrollRestoration = 'manual';
  }

  // ───── 模板讀取的狀態（全部委派給 Logic） ─────

  get demands(): HelperListItem[] {
    return this.logic.demands;
  }
  get filteredDemands(): HelperListItem[] {
    return this.logic.filteredDemands;
  }
  get pagedDemands(): HelperListItem[] {
    return this.logic.pagedDemands;
  }

  get selectAll(): boolean {
    return this.logic.selectAll;
  }
  set selectAll(value: boolean) {
    this.logic.selectAll = value;
  }

  get isLoading(): boolean {
    return this.logic.isLoading;
  }
  get loadError(): string {
    return this.logic.loadError;
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
  set sortAscending(value: boolean) {
    this.logic.sortAscending = value;
  }

  get showDeleteModal(): boolean {
    return this.logic.showDeleteModal;
  }
  get showOffShelfWarning(): boolean {
    return this.logic.showOffShelfWarning;
  }
  get showOnShelfWarning(): boolean {
    return this.logic.showOnShelfWarning;
  }

  get statusOptions() {
    return this.logic.statusOptions;
  }
  get priorityOptions() {
    return this.logic.priorityOptions;
  }
  get typeOptions() {
    return this.logic.typeOptions;
  }
  get messageOptions() {
    return this.logic.messageOptions;
  }
  get selectedFilters(): HelperFilterState {
    return this.logic.selectedFilters;
  }

  // ───── 生命週期 ─────

  ngOnInit(): void {
    this.logic.restoreListPosition();
    void this.loadDemands();
  }

  ngAfterViewInit(): void {
    this.applyUi(this.logic.getSavedScrollResult());
  }

  // ───── 導覽 ─────

  goToAddDemand(): void {
    this.router.navigate(['/agency/helper-form']);
  }

  goToDetail(id: number): void {
    this.saveListPosition();
    this.logic.markRestoreOnReturn();
    this.router.navigate(['/agency/helper-detail', id], {
      queryParams: {
        number: id,
      },
    });
  }

  goToEdit(id: number): void {
    this.saveListPosition();
    this.router.navigate(['/agency/helper-edit', id]);
  }

  saveListPosition(): void {
    this.logic.saveListPosition(window.scrollY);
  }

  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    this.saveListPosition();
  }

  // ───── 讀取 ─────

  async loadDemands(): Promise<void> {
    const loading = this.logic.loadDemands();
    this.cdr.detectChanges();
    await loading;
    this.cdr.detectChanges();
  }

  // ───── 搜尋 / 篩選 / 排序 ─────

  onSearchChange(value: string): void {
    this.logic.onSearchChange(value);
  }

  onFilterApply(filters: HelperFilterState): void {
    this.logic.onFilterApply(filters);
  }

  resetFilters(): void {
    this.logic.resetFilters();
  }

  applyFilters(resetPage = true): void {
    this.logic.applyFilters(resetPage);
  }

  onSortChange(event: { selectedSort: SortType; sortAscending: boolean }): void {
    const scrollY = window.scrollY;
    this.applyUi(this.logic.onSortChange(event), { scrollY });
  }

  applySort(): void {
    this.logic.applySort();
  }

  // ───── 分頁 / 選取 ─────

  updatePagination(): void {
    this.logic.updatePagination();
  }

  goToPage(page: number): void {
    this.logic.goToPage(page);
  }

  toggleAll(): void {
    this.logic.toggleAll();
  }

  hasSelected(): boolean {
    return this.logic.hasSelected();
  }

  // ───── 批次編輯 ─────

  editSelected(): void {
    this.applyUi(this.logic.prepareBatchEdit(window.scrollY));
  }

  // ───── 刪除 ─────

  openDeleteModal(id: number): void {
    this.applyUi(this.logic.openDeleteModal(id));
  }

  openBatchDeleteModal(): void {
    this.applyUi(this.logic.openBatchDeleteModal());
  }

  closeDeleteModal(): void {
    this.applyUi(this.logic.closeDeleteModal());
  }

  async confirmDelete(): Promise<void> {
    const result = await this.logic.confirmDelete();
    this.applyUi(result);
    this.cdr.detectChanges();
  }

  async onDeleted(): Promise<void> {
    await this.logic.onDeleted();
    this.cdr.detectChanges();
  }

  // ───── 狀態變更 ─────

  async changeStatus(item: HelperListItem, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const result = await this.logic.changeStatus(item, select.value as DisplayHelperStatus);
    this.applyUi(result, { select });
    this.cdr.detectChanges();
  }

  async confirmManualOffShelf(): Promise<void> {
    this.applyUi(await this.logic.confirmManualOffShelf());
    this.cdr.detectChanges();
  }

  cancelManualOffShelf(): void {
    this.applyUi(this.logic.cancelManualOffShelf());
  }

  async hideInsteadOfOffShelf(): Promise<void> {
    this.applyUi(await this.logic.hideInsteadOfOffShelf());
    this.cdr.detectChanges();
  }

  closeOffShelfWarning(): void {
    this.applyUi(this.logic.closeOffShelfWarning());
  }

  closeOnShelfWarning(): void {
    this.applyUi(this.logic.closeOnShelfWarning());
  }

  // ───── 套用 Logic 回傳的 UI 意圖 ─────
  // Modal 開關狀態由 Logic 持有，這裡只處理提示、導覽與捲動等 DOM 相關動作。

  private applyUi(result: ListUiResult, context: { scrollY?: number; select?: HTMLSelectElement } = {}): void {
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

    if (result.restoreScrollY != null) {
      this.restoreScroll(result.restoreScrollY);
    }

    if (result.scrollTop) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    if (result.preserveScrollY && context.scrollY !== undefined) {
      const scrollY = context.scrollY;
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      }, 0);
    }

    if (result.navigateTo) {
      this.router.navigate(result.navigateTo);
    }
  }

  private restoreScroll(scrollY: number): void {
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });

    requestAnimationFrame(() => {
      if (window.scrollY !== scrollY) {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
      }
    });
  }
}
