import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DonorDisasterCardComponent } from '../../../card/disaster/donor-disaster-card/donor-disaster-card.component';
import { PaginationComponent } from '../../../pagination/pagination.component';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { HelperDemandService } from '../../../../core/services/agency-helper-demand/helper-demand.service';
import { DisasterControlService } from '../../../../core/services/disaster-control/disaster-control.service';

import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { HelperDemand } from '../../../../models/agency/helper-demand';

export interface MaterialFilters {
  category: string[];
  priority: string[];
  hasRemaining: boolean;
}

export interface HelperFilters {
  helperType: string[];
  helperLocation: string[];
  hasRemaining: boolean;
}

export type DisasterFilters = MaterialFilters | HelperFilters;

@Component({
  selector: 'app-donor-disaster-card-list',
  standalone: true,
  imports: [DonorDisasterCardComponent, PaginationComponent],
  templateUrl: './donor-disaster-card-list.component.html',
  styleUrl: './donor-disaster-card-list.component.scss',
})
export class DonorDisasterCardListComponent implements OnInit, OnDestroy {
  @Input() type: 'material' | 'helper' = 'material';

  @Input() filters: DisasterFilters = {
    category: [],
    priority: [],
    hasRemaining: false,
  };

  protected disasterData!: DisasterControlService['data'];

  demands: DisasterDemand[] = [];
  helpers: HelperDemand[] = [];

  currentPage = 1;
  pageSize = 8;
  isLoading = true;

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
        void this.loadDemands();
      }
    });

    await Promise.all([this.disasterDemandService.waitUntilLoaded(), this.helperDemandService.waitUntilLoaded()]);

    await this.loadDemands();
  }

  private async loadDemands(): Promise<void> {
    this.isLoading = true;

    try {
      await Promise.all([this.disasterDemandService.reload(), this.helperDemandService.reload()]);

      this.demands = this.disasterDemandService.getDemands().filter((demand) => demand.status === '上架');

      this.helpers = this.helperDemandService.getHelpers().filter((helper) => helper.status === '上架');

      this.currentPage = 1;
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

    return this.demands.filter((demand) => {
      const categoryMatch = filters.category.length === 0 || filters.category.includes(demand.category);

      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(demand.priority);

      const remainingMatch = !filters.hasRemaining || (demand.remaining ?? 0) > 0;

      return categoryMatch && priorityMatch && remainingMatch;
    });
  }

  get filteredHelpers(): HelperDemand[] {
    if (this.type !== 'helper') {
      return this.helpers;
    }

    const filters = this.filters as HelperFilters;

    return this.helpers.filter((helper) => {
      const typeMatch = filters.helperType.length === 0 || filters.helperType.includes(helper.type);

      const locationMatch =
        filters.helperLocation.length === 0 || filters.helperLocation.some((location) => helper.location.includes(location));

      return typeMatch && locationMatch;
    });
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
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },
      (_, index) => index + 1
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
