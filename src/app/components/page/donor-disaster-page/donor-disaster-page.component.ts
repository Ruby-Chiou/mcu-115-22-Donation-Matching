import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DisasterControlService } from '../../../core/services/disaster-control.service';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';

import { DonorDisasterSupplyFilterComponent } from '../../filter/donor-disaster-supply-filter/donor-disaster-supply-filter.component';
import { DonorDisasterVolunteerFilterComponent } from '../../filter/donor-disaster-volunteer-filter/donor-disaster-volunteer-filter.component';

import { DonorDisasterCardListComponent } from '../../data-list/disaster/donor-disaster-card-list/donor-disaster-card-list.component';

@Component({
  selector: 'app-donor-disaster-page',
  imports: [DonorDisasterCardListComponent, DonorDisasterSupplyFilterComponent, DonorDisasterVolunteerFilterComponent],
  templateUrl: './donor-disaster-page.component.html',
  styleUrl: './donor-disaster-page.component.scss',
})
export class DonorDisasterPageComponent implements OnInit {
  showSupplyFilter = false;
  showVolunteerFilter = false;

  materialFilters = {
    category: [] as string[],
    priority: [] as string[],
    hasRemaining: false,
  };
  // =========================
  // 志工篩選條件
  // =========================
  volunteerFilters = {
    volunteerType: [] as string[],
    volunteerLocation: [] as string[],
    hasRemaining: false,
  };
  resetFilters(): void {
    // 目前在物資頁面
    if (this.activeType() === 'material') {
      this.materialFilters = {
        category: [],
        priority: [],
        hasRemaining: false,
      };
    }
    // 目前在志工頁面
    else {
      this.volunteerFilters = {
        volunteerType: [],
        volunteerLocation: [],
        hasRemaining: false,
      };
    }
  }
  protected readonly activeType = signal<'material' | 'volunteer'>('material');
  private disasterDemandService = inject(DisasterDemandService);
  protected readonly disasterData = inject(DisasterControlService).data;
  protected readonly demands = this.disasterDemandService.getDemands();
  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section === 'volunteer') {
      this.activeType.set('volunteer');
    } else {
      this.activeType.set('material');
    }
  }
  protected selectType(type: 'material' | 'volunteer'): void {
    this.activeType.set(type);
  }
  protected goToMap(): void {
    document.getElementById('disaster-map-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
