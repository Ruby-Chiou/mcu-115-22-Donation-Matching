import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { HelperDemandService } from '../../../core/services/agency-helper-demand/helper-demand.service';
import { taiwanAddressRegion } from '../../../core/map/taiwan-cities';
import { HelperLocationFilterService } from '../../../core/services/disaster-control/helper-location-filter.service';

export interface HelperFilters {
  helperType: string[];
  helperLocation: string[];
  cities: string[];
}

@Component({
  selector: 'app-donor-disaster-helper-filter',
  standalone: true,
  imports: [],
  templateUrl: './donor-disaster-helper-filter.component.html',
  styleUrl: './donor-disaster-helper-filter.component.scss',
})
export class DonorDisasterHelperFilterComponent implements OnInit {
  private helperDemandService = inject(HelperDemandService);
  private locationFilter = inject(HelperLocationFilterService);

  @Input()
  filters: HelperFilters = {
    helperType: [],
    helperLocation: [],
    cities: [],
  };

  @Output()
  filtersChange = new EventEmitter<HelperFilters>();

  helperTypeOptions: string[] = [];
  helperLocationOptions: string[] = [];
  cityOptions: string[] = [];

  /** 超過一個縣市才顯示縣市多選，避免單一縣市時多餘欄位。 */
  get showCityFilter(): boolean {
    return this.cityOptions.length > 1;
  }

  async ngOnInit(): Promise<void> {
    await this.helperDemandService.waitUntilLoaded();
    const demands = this.helperDemandService.getDemands();

    this.helperTypeOptions = [...new Set(demands.map((demand) => demand.type).filter((type) => type !== ''))];
    this.helperLocationOptions = [
      ...new Set(demands.map((demand) => demand.location.trim()).filter((location) => location !== '')),
    ];

    const cities = new Set<string>();
    for (const demand of demands) {
      const region = taiwanAddressRegion(demand.location);
      if (region.city) {
        cities.add(region.city);
      }
    }
    this.cityOptions = [...cities];
  }

  toggleCity(city: string): void {
    const cities = this.filters.cities;
    this.filters = {
      ...this.filters,
      cities: cities.includes(city) ? cities.filter((item) => item !== city) : [...cities, city],
    };
    this.emitFilters();
  }

  toggleHelperType(value: string): void {
    const helperType = this.filters.helperType;
    this.filters = {
      ...this.filters,
      helperType: helperType.includes(value)
        ? helperType.filter((item) => item !== value)
        : [...helperType, value],
    };
    this.emitFilters();
  }

  toggleHelperLocation(value: string): void {
    const helperLocation = this.filters.helperLocation;
    this.filters = {
      ...this.filters,
      helperLocation: helperLocation.includes(value)
        ? helperLocation.filter((item) => item !== value)
        : [...helperLocation, value],
    };
    this.emitFilters();
  }

  resetFilters(): void {
    this.filters = {
      helperType: [],
      helperLocation: [],
      cities: [],
    };
    this.emitFilters();
  }

  private emitFilters(): void {
    const cities = [...(this.filters.cities ?? [])];
    this.locationFilter.setCities(cities);
    this.filtersChange.emit({
      helperType: [...this.filters.helperType],
      helperLocation: [...this.filters.helperLocation],
      cities,
    });
  }
}
