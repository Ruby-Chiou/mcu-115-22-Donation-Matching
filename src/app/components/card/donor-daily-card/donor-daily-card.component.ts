import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {DonorDailyService, DailyDonation} from '../../../core/services/donor-daily.service';
import { DailyFilter } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';

@Component({
  selector: 'app-donor-daily-card',
  imports: [RouterLink, CommonModule ],
  templateUrl: './donor-daily-card.component.html',
  styleUrl: './donor-daily-card.component.scss',
})
export class DonorDailyCardComponent {
dailyDonations: DailyDonation[] = [];
filteredDailyDonations: DailyDonation[] = [];

  constructor(
    private donorDailyService: DonorDailyService
  ) {}

  ngOnInit(): void {
    this.dailyDonations =
      this.donorDailyService.getDailyDonations();
    this.filteredDailyDonations = this.dailyDonations;
  }
  currentPage = 1;
itemsPerPage = 8;

get totalPages(): number {
  return Math.ceil(
    this.filteredDailyDonations.length / this.itemsPerPage
  );
}

get paginatedDonations(): DailyDonation[] {
  const startIndex =
    (this.currentPage - 1) * this.itemsPerPage;

  const endIndex =
    startIndex + this.itemsPerPage;

  return this.filteredDailyDonations.slice(
    startIndex,
    endIndex
  );
}

goToPage(page: number): void {
  if (page < 1 || page > this.totalPages) {
    return;
  }

  this.currentPage = page;
}
onFilterChange(filter: DailyFilter): void {

  this.filteredDailyDonations =
    this.dailyDonations.filter(item => {

      const categoryMatch =
        filter.categories.length === 0 ||
        filter.categories.includes(item.category);

      const targetMatch =
        filter.targets.length === 0 ||
        filter.targets.includes(item.target);

      const regionMatch =
        filter.regions.length === 0 ||
        filter.regions.some(region =>
          item.receiveLocation.includes(region)
        );

      const receiveMethodMatch =
        filter.receiveMethods.length === 0 ||
        filter.receiveMethods.includes(
          item.receiveMethod
        );

      return (
        categoryMatch &&
        targetMatch &&
        regionMatch &&
        receiveMethodMatch
      );
    });

  this.currentPage = 1;
}
onSearch(keyword: string): void {

  if (!keyword) {
    this.filteredDailyDonations = [
      ...this.dailyDonations
    ];

    this.currentPage = 1;
    return;
  }

  const searchText =
    keyword.toLowerCase();

  this.filteredDailyDonations =
    this.dailyDonations.filter(item =>
      item.title.toLowerCase().includes(searchText) ||
      item.organization.toLowerCase().includes(searchText) ||
      item.receiveLocation.toLowerCase().includes(searchText)
    );

  this.currentPage = 1;
}
}
