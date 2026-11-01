import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DonorDailyCardComponent } from '../../../card/daily/donor-daily-card/donor-daily-card.component';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import {
  DemandSortMode,
  priorityLabel,
  priorityMatches,
  sortDemands,
} from '../../../../core/codes/demand-codes';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { DailyFilter } from '../../../filter/donor-daily-filter/donor-daily-filter.component';
import { PaginationComponent } from '../../../pagination/pagination.component';

@Component({
  selector: 'app-donor-daily-card-list',
  standalone: true,
  imports: [DonorDailyCardComponent, PaginationComponent],
  templateUrl: './donor-daily-card-list.component.html',
  styleUrl: './donor-daily-card-list.component.scss',
})
export class DonorDailyCardListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly demandService = inject(DailyDemandService);
  private readonly cdr = inject(ChangeDetectorRef);

  private allDailyDemands: DailyDemand[] = [];
  dailyDemands: DailyDemand[] = [];
  pagedDailyDemands: DailyDemand[] = [];
  pageSize = 8;
  currentPage = 1;
  isLoading = true;
  sortMode: DemandSortMode = 'priority-then-newest';

  private searchKeyword = '';
  private activeFilter: DailyFilter = {
    categories: [],
    targets: [],
    regions: [],
    receiveMethods: [],
    priorities: [],
  };

  @HostListener('window:resize')
  onResize(): void {
    const nextSize = this.computePageSize();
    if (nextSize === this.pageSize) {
      return;
    }
    this.pageSize = nextSize;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updatePagedDemands();
    this.cdr.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.pageSize = this.computePageSize();

    try {
      await this.demandService.waitUntilLoaded();
      const allDemands = this.demandService.getDemands();
      this.allDailyDemands = allDemands
        .filter((item) => item.status?.trim() === '上架')
        .map((item) => ({ ...item, priority: priorityLabel(item.priority) }));
      this.applyFilters();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('載入日常物資需求失敗：', error);
      this.allDailyDemands = [];
      this.dailyDemands = [];
      this.pagedDailyDemands = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.dailyDemands.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  openDetail(item: DailyDemand): void {
    this.router.navigate(['/donor/daily/detail', item.id]);
  }

  onSearch(keyword: string): void {
    this.searchKeyword = keyword.trim().toLowerCase();
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(filter: DailyFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(mode: DemandSortMode): void {
    this.sortMode = mode;
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updatePagedDemands();
    this.scrollListIntoView();
  }

  private applyFilters(): void {
    const filter = this.activeFilter;

    const filtered = this.allDailyDemands.filter((item) => {
      const matchesSearch =
        !this.searchKeyword ||
        item.item.toLowerCase().includes(this.searchKeyword) ||
        item.recipient.toLowerCase().includes(this.searchKeyword) ||
        item.address.toLowerCase().includes(this.searchKeyword);

      const matchesCategory = filter.categories.length === 0 || filter.categories.includes(item.category);
      const matchesTarget =
        filter.targets.length === 0 || filter.targets.some((target) => item.serviceTargets?.includes(target));
      const matchesRegion = filter.regions.length === 0 || filter.regions.some((region) => item.address?.includes(region));
      const matchesReceiveMethod =
        filter.receiveMethods.length === 0 ||
        filter.receiveMethods.some((method) => item.receiveMethod?.[method as keyof typeof item.receiveMethod]);
      const matchesPriority = priorityMatches(filter.priorities, item.priority);

      return matchesSearch && matchesCategory && matchesTarget && matchesRegion && matchesReceiveMethod && matchesPriority;
    });

    this.dailyDemands = sortDemands(filtered, this.sortMode);
    this.currentPage = 1;
    this.updatePagedDemands();
  }

  private updatePagedDemands(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedDailyDemands = this.dailyDemands.slice(startIndex, startIndex + this.pageSize);
  }

  private computePageSize(): number {
    const width = typeof window === 'undefined' ? 1200 : window.innerWidth;
    const minCard = width < 768 ? 160 : 240;
    const gap = 16;
    const horizontalPad = width < 768 ? 32 : 48;
    const cols = Math.max(1, Math.floor((width - horizontalPad) / (minCard + gap)));
    const rows = width < 768 ? 4 : width < 1024 ? 3 : 2;
    return Math.max(cols * rows, cols);
  }

  private scrollListIntoView(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const target =
      document.querySelector('#daily-lobby-supplies') || document.querySelector('.featured-section');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
