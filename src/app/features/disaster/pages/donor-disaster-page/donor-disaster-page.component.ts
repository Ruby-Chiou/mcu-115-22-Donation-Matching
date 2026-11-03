import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DisasterControlService } from '../../../../core/services/disaster-control/disaster-control.service';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';

import {
  DonorDisasterSupplyFilterComponent,
  SupplyFilters,
} from '../../../../components/filter/donor-disaster-supply-filter/donor-disaster-supply-filter.component';
import {
  DonorDisasterHelperFilterComponent,
  HelperFilters,
} from '../../../../components/filter/donor-disaster-helper-filter/donor-disaster-helper-filter.component';

import { DonorDisasterCardListComponent } from '../../../../components/data-list/disaster/donor-disaster-card-list/donor-disaster-card-list.component';
import { HelperLocationFilterService } from '../../../../core/services/disaster-control/helper-location-filter.service';

@Component({
  selector: 'app-donor-disaster-page',
  imports: [DonorDisasterCardListComponent, DonorDisasterSupplyFilterComponent, DonorDisasterHelperFilterComponent],
  templateUrl: './donor-disaster-page.component.html',
  styleUrl: './donor-disaster-page.component.scss',
})
export class DonorDisasterPageComponent implements OnInit {
  showSupplyFilter = false;
  showHelperFilter = false;

  materialFilters: SupplyFilters = {
    category: [],
    priority: [],
  };

  helperFilters: HelperFilters = {
    helperType: [],
    helperLocation: [],
    cities: [],
  };

  private readonly helperLocationFilter = inject(HelperLocationFilterService);
  protected readonly activeType = signal<'material' | 'helper'>('material');
  private disasterDemandService = inject(DisasterDemandService);
  protected readonly disasterData = inject(DisasterControlService).data;
  protected readonly demands = this.disasterDemandService.getDemands();
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // 避免上一次停留在地圖／篩選的縣市狀態，把協力列表濾成空白。
    this.helperLocationFilter.clear();

    const section = this.route.snapshot.queryParamMap.get('section');
    if (section === 'helper' || section === 'volunteer') {
      this.activeType.set('helper');
    } else {
      this.activeType.set('material');
    }
  }

  onMaterialFiltersChange(filters: SupplyFilters): void {
    this.materialFilters = {
      category: [...filters.category],
      priority: [...filters.priority],
    };
  }

  onHelperFiltersChange(filters: HelperFilters): void {
    this.helperFilters = {
      helperType: [...filters.helperType],
      helperLocation: [...filters.helperLocation],
      cities: [...(filters.cities ?? [])],
    };
  }

  resetFilters(): void {
    if (this.activeType() === 'material') {
      this.materialFilters = {
        category: [],
        priority: [],
      };
      return;
    }

    this.helperFilters = {
      helperType: [],
      helperLocation: [],
      cities: [],
    };
    this.helperLocationFilter.clear();
  }

  protected selectType(type: 'material' | 'helper'): void {
    this.activeType.set(type);
    if (type === 'helper') {
      this.helperLocationFilter.setCities(this.helperFilters.cities ?? []);
    }
  }

  protected goToMap(): void {
    document.getElementById('disaster-map-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
