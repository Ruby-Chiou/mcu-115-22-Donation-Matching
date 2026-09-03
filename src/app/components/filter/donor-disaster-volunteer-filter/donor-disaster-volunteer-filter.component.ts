import {  Component,  EventEmitter,  Input,  Output,  OnInit,  inject} from '@angular/core';
import {  VolunteerDemandService} from '../../../core/services/volunteer-demand.service';

export interface VolunteerFilters {
  volunteerType: string[];
  volunteerLocation: string[];
  hasRemaining: boolean;
}
@Component({
  selector: 'app-donor-disaster-volunteer-filter',
  standalone: true,
  imports: [],
  templateUrl: './donor-disaster-volunteer-filter.component.html',
  styleUrl: './donor-disaster-volunteer-filter.component.scss'
})
export class DonorDisasterVolunteerFilterComponent
  implements OnInit {

  private volunteerDemandService =
    inject(VolunteerDemandService);

  @Input()
  filters: VolunteerFilters = {
    volunteerType: [],
    volunteerLocation: [],
    hasRemaining: false
  };

  @Output()
  filtersChange =
    new EventEmitter<VolunteerFilters>();

  // 依服務類型的選項
  volunteerTypeOptions: string[] = [];

  // 依服務地點的選項
  volunteerLocationOptions: string[] = [];

  ngOnInit(): void {

    const demands =
      this.volunteerDemandService.getDemands();

    // =========================
    // 取得服務類型
    // =========================

    this.volunteerTypeOptions = [
      ...new Set(
        demands
          .map(demand => demand.type)
          .filter(type => type !== '')
      )
    ];

    // =========================
    // 取得服務地點
    // =========================

    this.volunteerLocationOptions = [
      ...new Set(
        demands
          .map(demand => demand.location.trim())
          .filter(location => location !== '')
      )
    ];
  }

  // =========================
  // 服務類型
  // =========================

  toggleVolunteerType(value: string): void {

    const volunteerType =
      this.filters.volunteerType;

    if (volunteerType.includes(value)) {

      this.filters = {
        ...this.filters,
        volunteerType:
          volunteerType.filter(
            item => item !== value
          )
      };

    } else {

      this.filters = {
        ...this.filters,
        volunteerType: [
          ...volunteerType,
          value
        ]
      };
    }

    this.emitFilters();
  }

  // =========================
  // 服務地點
  // =========================

  toggleVolunteerLocation(value: string): void {

    const volunteerLocation =
      this.filters.volunteerLocation;

    if (volunteerLocation.includes(value)) {

      this.filters = {
        ...this.filters,
        volunteerLocation:
          volunteerLocation.filter(
            item => item !== value
          )
      };

    } else {

      this.filters = {
        ...this.filters,
        volunteerLocation: [
          ...volunteerLocation,
          value
        ]
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
      hasRemaining:
        !this.filters.hasRemaining
    };

    this.emitFilters();
  }

  // =========================
  // 重置
  // =========================

  resetFilters(): void {

    this.filters = {
      volunteerType: [],
      volunteerLocation: [],
      hasRemaining: false
    };

    this.emitFilters();
  }

  private emitFilters(): void {

    this.filtersChange.emit({
      volunteerType: [
        ...this.filters.volunteerType
      ],

      volunteerLocation: [
        ...this.filters.volunteerLocation
      ],

      hasRemaining:
        this.filters.hasRemaining
    });
  }
}
