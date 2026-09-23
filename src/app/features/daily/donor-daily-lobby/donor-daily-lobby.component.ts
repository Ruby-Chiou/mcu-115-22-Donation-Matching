import { Component } from '@angular/core';
import { DonorDailyCardListComponent } from '../../../components/data-list/daily/donor-daily-card-list/donor-daily-card-list.component';
import { DonorDailyFilterComponent, DailyFilter } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';
import { DonorDailySearchComponent } from '../../../components/search-bar/donor-daily-search/donor-daily-search.component';
import { ThankYouWallComponent } from '../../thank-you-wall/thank-you-wall.component';

@Component({
  selector: 'app-donor-daily-lobby',
  standalone: true,
  imports: [DonorDailyCardListComponent, DonorDailyFilterComponent, DonorDailySearchComponent, ThankYouWallComponent],
  templateUrl: './donor-daily-lobby.component.html',
  styleUrl: './donor-daily-lobby.component.scss',
})
export class DonorDailyLobbyComponent {
  searchKeyword = '';
  activeFilter: DailyFilter = {
    categories: [],
    targets: [],
    regions: [],
    receiveMethods: [],
    priorities: [],
  };

  onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
  }

  onFilterChange(filter: DailyFilter): void {
    this.activeFilter = filter; // 這裡就能正確接收 DailyFilter
  }
}
