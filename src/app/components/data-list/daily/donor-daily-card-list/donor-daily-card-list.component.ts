import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';

import { DonorDailyCardComponent } from '../../../card/daily/donor-daily-card/donor-daily-card.component';

import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';

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

  readonly pageSize = 8;

  currentPage = 1;

  isLoading = true;

  private searchKeyword = '';

  private activeFilter: DailyFilter = {
    categories: [],
    targets: [],
    regions: [],
    receiveMethods: [],
    priorities: [],
  };

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    try {
      await this.demandService.waitUntilLoaded();

      const allDemands = this.demandService.getDemands();

      console.log('1. Service 全部資料筆數：', allDemands.length);

      console.log('2. Service 全部資料：', allDemands);

      this.allDailyDemands = allDemands.filter((item) => item.status?.trim() === '上架');

      console.log('3. 上架資料筆數：', this.allDailyDemands.length);

      this.applyFilters();

      this.cdr.detectChanges();

      console.log('4. 篩選後資料筆數：', this.dailyDemands.length);

      console.log('5. 分頁資料筆數：', this.pagedDailyDemands.length);
    } catch (error) {
      console.error('載入日常物資需求失敗：', error);

      this.allDailyDemands = [];
      this.dailyDemands = [];
      this.pagedDailyDemands = [];
    } finally {
      this.isLoading = false;

      this.cdr.detectChanges();

      console.log('6. 載入完成，畫面資料筆數：', this.pagedDailyDemands.length);
    }
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.dailyDemands.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },
      (_, index) => index + 1
    );
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

    this.dailyDemands = this.allDailyDemands.filter((item) => {
      const matchesSearch =
        !this.searchKeyword ||
        item.item.toLowerCase().includes(this.searchKeyword) ||
        item.recipient.toLowerCase().includes(this.searchKeyword) ||
        item.address.toLowerCase().includes(this.searchKeyword);

      const matchesCategory = filter.categories.length === 0 || filter.categories.includes(item.category);

      const matchesTarget = filter.targets.length === 0 || filter.targets.some((target) => item.serviceTargets?.includes(target));

      const matchesRegion = filter.regions.length === 0 || filter.regions.some((region) => item.address?.includes(region));

      const matchesReceiveMethod =
        filter.receiveMethods.length === 0 ||
        filter.receiveMethods.some((method) => item.receiveMethod?.[method as keyof typeof item.receiveMethod]);

      const matchesPriority = filter.priorities.length === 0 || filter.priorities.includes(item.priority);

      return matchesSearch && matchesCategory && matchesTarget && matchesRegion && matchesReceiveMethod && matchesPriority;
    });

    this.currentPage = 1;

    this.updatePagedDemands();
  }

  private updatePagedDemands(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    this.pagedDailyDemands = this.dailyDemands.slice(startIndex, startIndex + this.pageSize);

    console.log('目前頁碼：', this.currentPage);
    console.log('篩選後資料 dailyDemands：', this.dailyDemands);
    console.log('畫面應顯示資料 pagedDailyDemands：', this.pagedDailyDemands);
    console.log('畫面應顯示筆數：', this.pagedDailyDemands.length);
  }
}
