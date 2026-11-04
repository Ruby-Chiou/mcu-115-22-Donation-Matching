import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, takeUntil } from 'rxjs';
import { DailyDemand, DailyDisplayStatus } from '../../../../models/agency/daily-demand';
import { DailyListLogic } from '../../../logic/daily/daily-list-logic';
import type { DailyFilterState, DailyListItem, ReceiveMethod } from '../../../logic/daily/daily-list-logic';
import type { ListUiResult } from '../../../../core/ui/list-ui-result';
import { UiNoticeService } from '../../../../core/ui/ui-notice.service';
import { PaginationComponent } from '../../../pagination/pagination.component';
import { DailySearchBarComponent } from '../../../search-bar/daily-search-bar/daily-search-bar.component';
import { DailyFilterComponent } from '../../../filter/daily-filter/daily-filter.component';
import { DailySortBarComponent, SortType } from '../../../sort-bar/daily-sort-bar/daily-sort-bar.component';
import { SupplyLoadingComponent } from '../../../loading/supply-loading/supply-loading.component';
import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-daily-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ConfirmModalComponent,
    SupplyLoadingComponent,
    PaginationComponent,
    DailySearchBarComponent,
    DailySortBarComponent,
    DailyFilterComponent,
  ],
  providers: [DailyListLogic],
  templateUrl: './daily-list.component.html',
  styleUrls: ['./daily-list-A.component.scss', './daily-list-B.component.scss'],
})
export class DailyListComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly logic = inject(DailyListLogic);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notices = inject(UiNoticeService);

  constructor() {
    history.scrollRestoration = 'manual';
  }

  // ── template-compatible state (delegates to logic) ────────────────
  get demands(): DailyListItem[] {
    return this.logic.demands;
  }
  get filteredDemands(): DailyListItem[] {
    return this.logic.filteredDemands;
  }
  get pagedDemands(): DailyListItem[] {
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
  get searchTerm(): string {
    return this.logic.searchTerm;
  }
  set searchTerm(value: string) {
    this.logic.searchTerm = value;
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
  get selectedFilters(): DailyFilterState {
    return this.logic.selectedFilters;
  }
  get showDeleteModal(): boolean {
    return this.logic.showDeleteModal;
  }
  get deleteIds(): number[] {
    return this.logic.deleteIds;
  }
  get deleteType(): 'single' | 'batch' {
    return this.logic.deleteType;
  }
  get showFilterModal(): boolean {
    return this.logic.showFilterModal;
  }
  set showFilterModal(value: boolean) {
    this.logic.showFilterModal = value;
  }
  get showOffShelfWarning(): boolean {
    return this.logic.showOffShelfWarning;
  }
  get showOnShelfWarning(): boolean {
    return this.logic.showOnShelfWarning;
  }
  get pendingOffShelfItem(): DailyListItem | undefined {
    return this.logic.pendingOffShelfItem;
  }
  get statusOptions(): DailyDisplayStatus[] {
    return this.logic.statusOptions;
  }
  get priorityOptions(): DailyDemand['priority'][] {
    return this.logic.priorityOptions;
  }
  get receiveMethodOptions(): ReceiveMethod[] {
    return this.logic.receiveMethodOptions;
  }
  get categoryOptions(): NonNullable<DailyDemand['category']>[] {
    return this.logic.categoryOptions;
  }
  get messageOptions(): string[] {
    return this.logic.messageOptions;
  }

  // ── lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.logic.stateChanges.pipe(takeUntil(this.logic.destroyed$)).subscribe((kind) => {
      if (kind === 'mark') {
        this.cdr.markForCheck();
      } else {
        this.cdr.detectChanges();
      }
    });

    this.logic.restorePosition();

    void this.loadDemands();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.logic.destroyed$)
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
    this.applyUiResult(this.logic.getRestoreScroll());
  }

  ngOnDestroy(): void {
    this.logic.destroy();
  }

  @HostListener('window:beforeunload')
  saveScrollPosition(): void {
    this.logic.snapshotPosition(window.scrollY);
  }

  // ── navigation ────────────────────────────────────────────────────
  goToAddDemand(): void {
    this.applyUiResult(this.logic.goToAddDemand());
  }

  goToDetail(serialNo: number | undefined): void {
    this.applyUiResult(this.logic.goToDetail(serialNo, window.scrollY));
  }

  goToEdit(id: number): void {
    this.applyUiResult(this.logic.goToEdit(id, window.scrollY));
  }

  saveListPosition(): void {
    this.logic.snapshotPosition(window.scrollY);
  }

  // ── sort ──────────────────────────────────────────────────────────
  onSortChange(value: SortType): void {
    const scrollY = window.scrollY;
    this.applyUiResult(this.logic.onSortChange(value), scrollY);
  }

  onSortOrderChange(ascending: boolean): void {
    const scrollY = window.scrollY;
    this.applyUiResult(this.logic.onSortOrderChange(ascending), scrollY);
  }

  // ── load / search / filter ────────────────────────────────────────
  async loadDemands(): Promise<void> {
    this.applyUiResult(await this.logic.loadDemands());
  }

  onSearch(): void {
    this.logic.onSearch();
  }

  clearSearch(): void {
    this.logic.clearSearch();
  }

  openFilterModal(): void {
    this.logic.openFilterModal();
  }

  closeFilterModal(): void {
    this.logic.closeFilterModal();
  }

  resetFilters(): void {
    this.logic.resetFilters();
  }

  applyFilterFromModal(): void {
    this.logic.applyFilterFromModal();
  }

  applyFilters(resetPage: boolean = true): void {
    this.logic.applyFilters(resetPage);
  }

  applySort(): void {
    this.logic.applySort();
  }

  updatePagination(): void {
    this.logic.updatePagination();
  }

  goToPage(page: number): void {
    this.applyUiResult(this.logic.goToPage(page));
  }

  // ── selection / batch ─────────────────────────────────────────────
  toggleAll(): void {
    this.logic.toggleAll();
  }

  hasSelected(): boolean {
    return this.logic.hasSelected();
  }

  editSelected(): void {
    this.applyUiResult(this.logic.editSelected(window.scrollY));
  }

  // ── delete ────────────────────────────────────────────────────────
  openDeleteModal(id: number): void {
    this.logic.openDeleteModal(id);
  }

  openBatchDeleteModal(): void {
    this.applyUiResult(this.logic.openBatchDeleteModal());
  }

  closeDeleteModal(): void {
    this.logic.closeDeleteModal();
  }

  async confirmDelete(): Promise<void> {
    this.applyUiResult(await this.logic.confirmDelete());
  }

  async onDeleted(): Promise<void> {
    await this.logic.onDeleted();
  }

  // ── status / off-shelf ────────────────────────────────────────────
  async changeStatus(item: DailyListItem, newStatus: DailyDisplayStatus): Promise<void> {
    this.applyUiResult(await this.logic.changeStatus(item, newStatus));
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    return this.logic.calculateExpectedOffShelfDate(publishedDate, priority);
  }

  async confirmManualOffShelf(): Promise<void> {
    this.applyUiResult(await this.logic.confirmManualOffShelf());
  }

  cancelManualOffShelf(): void {
    this.logic.cancelManualOffShelf();
  }

  async hideInsteadOfOffShelf(): Promise<void> {
    this.applyUiResult(await this.logic.hideInsteadOfOffShelf());
  }

  closeOffShelfWarning(): void {
    this.logic.closeOffShelfWarning();
  }

  closeOnShelfWarning(): void {
    this.logic.closeOnShelfWarning();
  }

  // ── UI result application ─────────────────────────────────────────
  private applyUiResult(result: ListUiResult | undefined, preservedScrollY?: number): void {
    if (!result) {
      return;
    }

    if (result.notice) {
      void this.notices.alert(result.notice);
    }

    if (result.scrollTop) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    if (result.preserveScrollY && preservedScrollY != null) {
      setTimeout(() => {
        window.scrollTo({ top: preservedScrollY, behavior: 'instant' });
      }, 0);
    }

    if (result.restoreScrollY != null) {
      const scrollY = result.restoreScrollY;
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });

      requestAnimationFrame(() => {
        if (window.scrollY !== scrollY) {
          window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
        }
      });
    }

    if (result.navigateTo) {
      void this.router.navigate(result.navigateTo);
    }
  }
}
