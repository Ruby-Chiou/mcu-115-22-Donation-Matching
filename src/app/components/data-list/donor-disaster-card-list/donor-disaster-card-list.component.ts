import { Component, Input, inject } from '@angular/core';

import { DonorDisasterCardComponent } from '../../card/donor-disaster-card/donor-disaster-card.component';

import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

import { DisasterControlService } from '../../../core/services/disaster-control.service';


// ==============================
// 🟢 物資篩選條件
// ==============================
export interface MaterialFilters {
  category: string[];
  priority: string[];
  hasRemaining: boolean;
}


// ==============================
// 🟢 志工篩選條件
// ==============================
export interface VolunteerFilters {
  volunteerType: string[];
  volunteerLocation: string[];
  hasRemaining: boolean;
}


// ==============================
// 🟢 篩選條件總類型
// ==============================
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


  demands: DailyDemand[];

  volunteers: VolunteerDemand[];


  constructor(
    private dailyDemandService: DailyDemandService,
    private volunteerDemandService: VolunteerDemandService
  ) {

    // 取得物資需求
    this.demands = this.dailyDemandService
      .getDemands()
      .filter((demand) => demand.status === '上架');


    // 取得志工需求
    this.volunteers =
      this.volunteerDemandService.getVolunteers();
  }


  // =====================================================
  // 🟢 物資篩選後的資料
  // =====================================================
  get filteredDemands(): DailyDemand[] {

    // 如果目前不是物資，直接回傳全部
    if (this.type !== 'material') {
      return this.demands;
    }

    // 確認 filters 是物資篩選
    const filters = this.filters as MaterialFilters;

    return this.demands.filter((demand) => {

      // 類別
      const categoryMatch =
        filters.category.length === 0 ||
        filters.category.includes(demand.category);


      // 優先度
      const priorityMatch =
        filters.priority.length === 0 ||
        filters.priority.includes(demand.priority);


      // 剩餘需求
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


  // =====================================================
  // 🟢 志工篩選後的資料
  // =====================================================
  get filteredVolunteers(): VolunteerDemand[] {

    // 如果目前不是志工，直接回傳全部
    if (this.type !== 'volunteer') {
      return this.volunteers;
    }

    // 確認 filters 是志工篩選
    const filters = this.filters as VolunteerFilters;

    return this.volunteers.filter((volunteer) => {

      // 服務類型
      const typeMatch =
        filters.volunteerType.length === 0 ||
        filters.volunteerType.includes(
          volunteer.serviceTime
        );


      // 服務地點
      const locationMatch =
        filters.volunteerLocation.length === 0 ||
        filters.volunteerLocation.includes(
          volunteer.location
        );

     return typeMatch && locationMatch;
    });
  }
}
