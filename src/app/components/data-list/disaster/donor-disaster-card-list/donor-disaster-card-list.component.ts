import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DonorDisasterCardComponent } from '../../../card/disaster/donor-disaster-card/donor-disaster-card.component';
import { PaginationComponent } from '../../../pagination/pagination.component';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { HelperDemandService } from '../../../../core/services/agency-helper-demand/helper-demand.service';
import { DisasterControlService } from '../../../../core/services/disaster-control/disaster-control.service';

import { sortByPriorityThenDate } from '../../../../core/codes/demand-codes';
import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { HelperDemand } from '../../../../models/agency/helper-demand';
import { sameTaiwanCity, taiwanAddressRegion } from '../../../../core/map/taiwan-cities';

export interface MaterialFilters {
  category: string[];
  priority: string[];
}

export interface HelperFilters {
  helperType: string[];
  helperLocation: string[];
  cities: string[];
}

export type DisasterFilters = MaterialFilters | HelperFilters;

@Component({
  selector: 'app-donor-disaster-card-list',
  standalone: true,
  imports: [DonorDisasterCardComponent, PaginationComponent],
  templateUrl: './donor-disaster-card-list.component.html',
  styleUrl: './donor-disaster-card-list.component.scss',
})
export class DonorDisasterCardListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() type: 'material' | 'helper' = 'material';

  @Input() filters: DisasterFilters = {
    category: [],
    priority: [],
  };

  protected disasterData!: DisasterControlService['data'];

  demands: DisasterDemand[] = [];
  helpers: HelperDemand[] = [];

  currentPage = 1;
  pageSize = 8;
  isLoading = true;
  private hasLoadedOnce = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly disasterDemandService: DisasterDemandService,
    private readonly helperDemandService: HelperDemandService,
    private readonly disasterControlService: DisasterControlService
  ) {
    this.disasterData = this.disasterControlService.data;
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    this.disasterDemandService.demandChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.type === 'material') {
        void this.loadDemands({ resetPage: false, showLoading: false });
      }
    });

    this.helperDemandService.demandChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.type === 'helper') {
        void this.loadDemands({ resetPage: false, showLoading: false });
      }
    });

    await Promise.all([this.disasterDemandService.waitUntilLoaded(), this.helperDemandService.waitUntilLoaded()]);

    await this.loadDemands({ resetPage: true, showLoading: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.hasLoadedOnce) {
      return;
    }

    if (changes['filters'] || changes['type']) {
      this.currentPage = 1;
      this.clampCurrentPage();
    }
  }

  private async loadDemands(options: { resetPage: boolean; showLoading: boolean }): Promise<void> {
    if (options.showLoading || !this.hasLoadedOnce) {
      this.isLoading = true;
    }

    try {
      // 首次才強制 reload；後續訂閱只讀目前快取，避免點分頁時整頁重載跳回第 1 頁。
      if (!this.hasLoadedOnce) {
        await Promise.all([this.disasterDemandService.reload(), this.helperDemandService.reload()]);
      }

      this.demands = this.disasterDemandService.getDemands().filter((demand) => demand.status === '上架');
      this.helpers = this.helperDemandService.getDemands().filter((helper) => helper.status === '上架');

      if (options.resetPage) {
        this.currentPage = 1;
      } else {
        this.clampCurrentPage();
      }

      this.hasLoadedOnce = true;
    } catch (error) {
      console.error('載入捐贈需求失敗：', error);

      this.demands = [];
      this.helpers = [];
      this.currentPage = 1;
    } finally {
      this.isLoading = false;
    }
  }

  get filteredDemands(): DisasterDemand[] {
    if (this.type !== 'material') {
      return this.demands;
    }

    const filters = this.filters as MaterialFilters;

    const filtered = this.demands.filter((demand) => {
      const categoryMatch = filters.category.length === 0 || filters.category.includes(demand.category);
      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(demand.priority);
      return categoryMatch && priorityMatch;
    });

    return sortByPriorityThenDate(filtered);
  }

  get filteredHelpers(): HelperDemand[] {
    if (this.type !== 'helper') {
      return this.helpers;
    }

    const filters = this.filters as HelperFilters;
    const cities = Array.isArray(filters.cities) ? filters.cities : [];
    const helperTypes = Array.isArray(filters.helperType) ? filters.helperType : [];
    const helperLocations = Array.isArray(filters.helperLocation) ? filters.helperLocation : [];

    const filtered = this.helpers.filter((helper) => {
      const typeMatch = helperTypes.length === 0 || helperTypes.includes(helper.type);
      const locationMatch =
        helperLocations.length === 0 ||
        helperLocations.some((location) => (helper.location || '').includes(location));
      const region = taiwanAddressRegion(helper.location || '');
      const cityMatch =
        cities.length === 0 || (!!region.city && cities.some((city) => sameTaiwanCity(city, region.city)));

      return typeMatch && locationMatch && cityMatch;
    });

    return sortByPriorityThenDate(filtered);
  }

  get paginatedDemands(): DisasterDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDemands.slice(start, start + this.pageSize);
  }

  get paginatedHelpers(): HelperDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHelpers.slice(start, start + this.pageSize);
  }

  get totalItems(): number {
    return this.type === 'material' ? this.filteredDemands.length : this.filteredHelpers.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize) || 1);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.scrollListIntoView();
  }

  private clampCurrentPage(): void {
    this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages);
  }

  private scrollListIntoView(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const target = document.querySelector('.card-list') || document.querySelector('.needs-section');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
