import { Component, ViewChild } from '@angular/core';
import { DonorDailyCardListComponent } from '../../../components/data-list/daily/donor-daily-card-list/donor-daily-card-list.component';
import { DonorDailyFilterComponent } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';
import { DailyFilter } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';
import { DonorDailySearchComponent } from '../../../components/search-bar/donor-daily-search/donor-daily-search.component';

@Component({
  selector: 'app-donor-daily-lobby',
  standalone: true,
  imports: [DonorDailyCardListComponent, DonorDailyFilterComponent, DonorDailySearchComponent],
  templateUrl: './donor-daily-lobby.component.html',
  styleUrl: './donor-daily-lobby.component.scss',
})
export class DonorDailyLobbyComponent {
  @ViewChild(DonorDailyCardListComponent)
  dailyCard?: DonorDailyCardListComponent;

  onSearchChange(keyword: string): void {
    this.dailyCard?.onSearch(keyword);
  }

  onFilterChange(filter: DailyFilter): void {
    this.dailyCard?.onFilterChange(filter);
  }
}
