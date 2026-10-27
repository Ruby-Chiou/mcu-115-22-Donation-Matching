import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DisasterControlService } from '../../../../core/services/disaster-control/disaster-control.service';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';

import { DonorDisasterSupplyFilterComponent } from '../../../../components/filter/donor-disaster-supply-filter/donor-disaster-supply-filter.component';
import { DonorDisasterHelperFilterComponent } from '../../../../components/filter/donor-disaster-helper-filter/donor-disaster-helper-filter.component';

import { DonorDisasterCardListComponent } from '../../../../components/data-list/disaster/donor-disaster-card-list/donor-disaster-card-list.component';

@Component({
  selector: 'app-donor-disaster-page',
  imports: [DonorDisasterCardListComponent, DonorDisasterSupplyFilterComponent, DonorDisasterHelperFilterComponent],
  templateUrl: './donor-disaster-page.component.html',
  styleUrl: './donor-disaster-page.component.scss',
})
export class DonorDisasterPageComponent implements OnInit {
  showSupplyFilter = false;
  showHelperFilter = false;

  materialFilters = {
    category: [] as string[],
    priority: [] as string[],
    hasRemaining: false,
  };
  // =========================
  // 協力者篩選條件
  // =========================
  helperFilters = {
    helperType: [] as string[],
    helperLocation: [] as string[],
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
    // 目前在協力者頁面
    else {
      this.helperFilters = {
        helperType: [],
        helperLocation: [],
        hasRemaining: false,
      };
    }
  }
  protected readonly activeType = signal<'material' | 'helper'>('material');
  private disasterDemandService = inject(DisasterDemandService);
  protected readonly disasterData = inject(DisasterControlService).data;
  protected readonly demands = this.disasterDemandService.getDemands();
  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section === 'helper' || section === 'volunteer') {
      this.activeType.set('helper');
    } else {
      this.activeType.set('material');
    }
  }
  protected selectType(type: 'material' | 'helper'): void {
    this.activeType.set(type);
  }
  protected goToMap(): void {
    document.getElementById('disaster-map-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
