import { DonorDailyCardComponent } from '../../../components/card/donor-daily-card/donor-daily-card.component';
import { DonorDailyFilterComponent } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';
import { DonorDailySearchComponent } from '../../../components/search-bar/donor-daily-search/donor-daily-search.component';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-donor-daily-lobby',
  standalone: true,
  imports: [DonorDailyCardComponent, DonorDailyFilterComponent, DonorDailySearchComponent],
  templateUrl: './donor-daily-lobby.component.html',
  styleUrl: './donor-daily-lobby.component.scss',
})
export class DonorDailyLobbyComponent {}
