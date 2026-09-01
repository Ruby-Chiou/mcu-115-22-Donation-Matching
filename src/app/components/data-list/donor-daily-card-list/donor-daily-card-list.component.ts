import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DonorDailyCardComponent } from '../../card/donor-daily-card/donor-daily-card.component';
import { DailyFilter } from '../../filter/donor-daily-filter/donor-daily-filter.component';
import { PaginationComponent } from '../../pagination/pagination.component';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

@Component({
  selector: 'app-donor-daily-card-list',
  standalone: true,
  imports: [DonorDailyCardComponent, PaginationComponent],
  templateUrl: './donor-daily-card-list.component.html',
  styleUrl: './donor-daily-card-list.component.scss',
})
export class DonorDailyCardListComponent {
  private readonly router = inject(Router);
  private readonly demandService = inject(DailyDemandService);
  private readonly allDailyDemands = this.demandService.getDemands();

  dailyDemands: DailyDemand[] = [...this.allDailyDemands];
  pagedDailyDemands: DailyDemand[] = [];
  readonly pageSize = 8;
  currentPage = 1;
  private searchKeyword = '';
  private activeFilter: DailyFilter = {
    categories: [],
    targets: [],
    regions: [],
    receiveMethods: [],
    priorities: []
  };

  constructor() {
    this.updatePagedDemands();
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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updatePagedDemands();
  }

  private applyFilters(): void {
  const filter = this.activeFilter;

  this.dailyDemands = this.allDailyDemands.filter(item => {

    //搜尋
    const matchesSearch =
      !this.searchKeyword ||
      item.item.toLowerCase().includes(this.searchKeyword) ||
      item.recipient.toLowerCase().includes(this.searchKeyword) ||
      item.address.toLowerCase().includes(this.searchKeyword);

    // 類別
    const matchesCategory =
      filter.categories.length === 0 ||
      filter.categories.includes(item.category);

    //服務對象
    const matchesTarget =
      filter.targets.length === 0 ||
      filter.targets.some(target =>
        item.serviceTargets?.[
          target as keyof typeof item.serviceTargets
        ]
      );

    // 縣市
    const matchesRegion =
      filter.regions.length === 0 ||
      filter.regions.some(region =>
        item.address?.includes(region)
      );

    //接收方式
    const matchesReceiveMethod =
      filter.receiveMethods.length === 0 ||
      filter.receiveMethods.some(method =>
        item.receiveMethod?.[
          method as keyof typeof item.receiveMethod
        ]
      );

    //優先程度
    const matchesPriority =
      filter.priorities.length === 0 ||
      filter.priorities.includes(item.priority);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesTarget &&
      matchesRegion &&
      matchesReceiveMethod &&
      matchesPriority
    );
  });

  this.currentPage = 1;
  this.updatePagedDemands();
}
  private updatePagedDemands(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedDailyDemands = this.dailyDemands.slice(startIndex, startIndex + this.pageSize);
  }
}
