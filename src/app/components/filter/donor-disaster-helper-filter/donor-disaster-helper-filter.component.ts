import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { HelperDemandService } from '../../../core/services/agency-helper-demand/helper-demand.service';

export interface HelperFilters {
  helperType: string[];
  helperLocation: string[];
  hasRemaining: boolean;
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

  @Input()
  filters: HelperFilters = {
    helperType: [],
    helperLocation: [],
    hasRemaining: false,
  };

  @Output()
  filtersChange = new EventEmitter<HelperFilters>();

  // 依服務類型的選項
  helperTypeOptions: string[] = [];

  // 依服務地點的選項
  helperLocationOptions: string[] = [];

  ngOnInit(): void {
    const demands = this.helperDemandService.getDemands();

    // =========================
    // 取得服務類型
    // =========================

    this.helperTypeOptions = [...new Set(demands.map((demand) => demand.type).filter((type) => type !== ''))];

    // =========================
    // 取得服務地點
    // =========================

    this.helperLocationOptions = [...new Set(demands.map((demand) => demand.location.trim()).filter((location) => location !== ''))];
  }

  // =========================
  // 服務類型
  // =========================

  toggleHelperType(value: string): void {
    const helperType = this.filters.helperType;

    if (helperType.includes(value)) {
      this.filters = {
        ...this.filters,
        helperType: helperType.filter((item) => item !== value),
      };
    } else {
      this.filters = {
        ...this.filters,
        helperType: [...helperType, value],
      };
    }

    this.emitFilters();
  }

  // =========================
  // 服務地點
  // =========================

  toggleHelperLocation(value: string): void {
    const helperLocation = this.filters.helperLocation;

    if (helperLocation.includes(value)) {
      this.filters = {
        ...this.filters,
        helperLocation: helperLocation.filter((item) => item !== value),
      };
    } else {
      this.filters = {
        ...this.filters,
        helperLocation: [...helperLocation, value],
      };
    }

    this.emitFilters();
  }

  // =========================
  // 剩餘名額
  // =========================

  toggleRemaining(): void {
    this.filters = {
      ...this.filters,
      hasRemaining: !this.filters.hasRemaining,
    };

    this.emitFilters();
  }

  // =========================
  // 重置
  // =========================

  resetFilters(): void {
    this.filters = {
      helperType: [],
      helperLocation: [],
      hasRemaining: false,
    };

    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      helperType: [...this.filters.helperType],

      helperLocation: [...this.filters.helperLocation],

      hasRemaining: this.filters.hasRemaining,
    });
  }
}
