import { Component, Input, inject } from '@angular/core';
import { DonorDisasterCardComponent } from '../../card/donor-disaster-card/donor-disaster-card.component';

import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/demand';

import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/agency/vdemand';

import { DisasterControlService } from '../../../core/services/disaster-control.service';

export interface MaterialFilters {
  category: string[];
  priority: string[];
  hasRemaining: boolean;
}

export interface VolunteerFilters {
  volunteerType: string[];
  volunteerLocation: string[];
  hasRemaining: boolean;
}

export type DisasterFilters =
  | MaterialFilters
  | VolunteerFilters;

@Component({
  selector: 'app-donor-disaster-card-list',
  imports: [DonorDisasterCardComponent],
  templateUrl: './donor-disaster-card-list.component.html',
  styleUrl: './donor-disaster-card-list.component.scss',
})
export class DonorDisasterCardListComponent {

  // 目前顯示：物資 or 志工
  @Input() type: 'material' | 'volunteer' = 'material';

  // 篩選條件
  @Input() filters: DisasterFilters = {
    category: [],
    priority: [],
    hasRemaining: false
  };

  protected readonly disasterData =
    inject(DisasterControlService).data;

  // 物資需求
  demands: DisasterDemand[] = [];

  // 志工需求
  volunteers: VolunteerDemand[] = [];

  constructor(
    private disasterDemandService: DisasterDemandService,
    private volunteerDemandService: VolunteerDemandService
  ) {
    // 從 DisasterDemandService 取得物資
    this.demands = this.disasterDemandService
      .getDemands()
      .filter((demand) => demand.status === '上架');

    // 從 VolunteerDemandService 取得志工
    this.volunteers =
      this.volunteerDemandService.getVolunteers();
  }

  get filteredDemands(): DisasterDemand[] {

    if (this.type !== 'material') {
      return this.demands;
    }

    const filters = this.filters as MaterialFilters;

    return this.demands.filter((demand) => {

      const categoryMatch =
        filters.category.length === 0 ||
        filters.category.includes(demand.category);

      const priorityMatch =
        filters.priority.length === 0 ||
        filters.priority.includes(demand.priority);

      const remainingMatch =
        !filters.hasRemaining ||
        (demand.remaining ?? 0) > 0;

      return (
        categoryMatch &&
        priorityMatch &&
        remainingMatch
      );
    });
  }

  get filteredVolunteers(): VolunteerDemand[] {

    if (this.type !== 'volunteer') {
      return this.volunteers;
    }

    const filters = this.filters as VolunteerFilters;

    return this.volunteers.filter((volunteer) => {

      const typeMatch =
        filters.volunteerType.length === 0 ||
        filters.volunteerType.includes(volunteer.type);

      const locationMatch =
        filters.volunteerLocation.length === 0 ||
        filters.volunteerLocation.includes(volunteer.location);

      return typeMatch && locationMatch;
    });
  }
}
