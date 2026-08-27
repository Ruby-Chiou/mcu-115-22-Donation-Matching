import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {DonorDailyService, DailyDonation} from '../../../core/services/donor-daily.service';

@Component({
  selector: 'app-donor-daily-detail',
  imports: [RouterLink, CommonModule,RouterModule],
  templateUrl: './donor-daily-detail.component.html',
  styleUrl: './donor-daily-detail.component.scss',
})
export class DonorDailyDetailComponent {
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
