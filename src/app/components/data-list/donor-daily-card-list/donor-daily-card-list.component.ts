import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DonorDailyCardComponent } from '../../card/donor-daily-card/donor-daily-card.component';
import { DailyFilter } from '../../filter/donor-daily-filter/donor-daily-filter.component';
import { PaginationComponent } from '../../pagination/pagination.component';
import { DonorDailyService, DailyDonation } from '../../../core/services/donor-daily.service';

@Component({
  selector: 'app-donor-daily-card-list',
  standalone: true,
  imports: [DonorDailyCardComponent, PaginationComponent],
  templateUrl: './donor-daily-card-list.component.html',
  styleUrl: './donor-daily-card-list.component.scss',
})
export class DonorDailyCardListComponent {
  private readonly router = inject(Router);
  private readonly donorDailyService = inject(DonorDailyService);
  private readonly allDailyDonations =
    this.donorDailyService.getDailyDonations();

  dailyDonations: DailyDonation[] =
    [...this.allDailyDonations];
  pagedDailyDonations: DailyDonation[] = [];
  readonly pageSize = 8;
  currentPage = 1;
  private searchKeyword = '';
  private activeFilter: DailyFilter = {
    categories: [],
    targets: [],
    regions: [],
    receiveMethods: []
  };

  constructor() {
    this.updatePagedDonations();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.dailyDonations.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  openDetail(item: DailyDonation): void {
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
    this.updatePagedDonations();
  }

  private applyFilters(): void {
    const filter = this.activeFilter;

    this.dailyDonations = this.allDailyDonations.filter(item => {
      const matchesSearch = !this.searchKeyword ||
        item.title.toLowerCase().includes(this.searchKeyword) ||
        item.organization.toLowerCase().includes(this.searchKeyword) ||
        item.receiveLocation.toLowerCase().includes(this.searchKeyword);
      const matchesFilter =
        (filter.categories.length === 0 || filter.categories.includes(item.category)) &&
        (filter.targets.length === 0 || filter.targets.includes(item.target)) &&
        (filter.regions.length === 0 || filter.regions.some(region => item.receiveLocation.includes(region))) &&
        (filter.receiveMethods.length === 0 || filter.receiveMethods.includes(item.receiveMethod));

      return matchesSearch && matchesFilter;
    });

    this.updatePagedDonations();
  }

  private updatePagedDonations(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedDailyDonations = this.dailyDonations.slice(startIndex, startIndex + this.pageSize);
  }
}
