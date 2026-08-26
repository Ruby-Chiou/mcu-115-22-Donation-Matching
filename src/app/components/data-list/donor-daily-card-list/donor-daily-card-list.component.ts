import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {DonorDailyService, DailyDonation} from '../../../core/services/donor-daily.service';

@Component({
  selector: 'app-donor-daily-card-list',
  standalone: true,
  imports: [RouterLink, CommonModule,RouterModule],
  templateUrl: './donor-daily-card-list.component.html',
  styleUrl: './donor-daily-card-list.component.scss',
})
export class DonorDailyCardListComponent {
 donation?: DailyDonation;

  constructor(
    private route: ActivatedRoute,
    private donorDailyService: DonorDailyService
  ) {}

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.donation =
      this.donorDailyService.getDailyDonationById(id);

    console.log('目前物資：', this.donation);
  }
}
