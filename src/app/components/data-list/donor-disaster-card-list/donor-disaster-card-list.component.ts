import { Component, Input, inject } from '@angular/core';
import { DonorDisasterCardComponent } from '../../card/donor-disaster-card/donor-disaster-card.component';

import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/demand';

import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/agency/vdemand';

import { DisasterControlService } from '../../../core/services/disaster-control.service';
import { PaginationComponent } from '../../pagination/pagination.component';

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

export type DisasterFilters = MaterialFilters | VolunteerFilters;

@Component({
  selector: 'app-donor-disaster-card-list',
  imports: [DonorDisasterCardComponent, PaginationComponent],
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
    hasRemaining: false,
  };

  protected readonly disasterData = inject(DisasterControlService).data;

  // 物資需求
  demands: DisasterDemand[] = [];

  // 志工需求
  volunteers: VolunteerDemand[] = [];

  constructor(
    private disasterDemandService: DisasterDemandService,
    private volunteerDemandService: VolunteerDemandService
  ) {
    // 從 DisasterDemandService 取得物資
    this.demands = this.disasterDemandService.getDemands().filter((demand) => demand.status === '上架');

    // 從 VolunteerDemandService 取得志工
    this.volunteers = this.volunteerDemandService.getVolunteers();
  }

  get filteredDemands(): DisasterDemand[] {
    if (this.type !== 'material') {
      return this.demands;
    }

    const filters = this.filters as MaterialFilters;

    return this.demands.filter((demand) => {
      const categoryMatch = filters.category.length === 0 || filters.category.includes(demand.category);

      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(demand.priority);

      const remainingMatch = !filters.hasRemaining || (demand.remaining ?? 0) > 0;

      return categoryMatch && priorityMatch && remainingMatch;
    });
  }

  get filteredVolunteers(): VolunteerDemand[] {
    if (this.type !== 'volunteer') {
      return this.volunteers;
    }

    const filters = this.filters as VolunteerFilters;

    return this.volunteers.filter((volunteer) => {
      const typeMatch = filters.volunteerType.length === 0 || filters.volunteerType.includes(volunteer.type);

      const locationMatch =
        filters.volunteerLocation.length === 0 || filters.volunteerLocation.some((location) => volunteer.location.includes(location));

      return typeMatch && locationMatch;
    });
  }

  // 分頁相關變數
  currentPage: number = 1;
  pageSize: number = 8; // 依需求調整每頁顯示幾筆

  // 切換分頁時觸發的方法
  onPageChange(page: number) {
    this.currentPage = page;
  }

  // 取得目前分頁後的物資資料
  get paginatedDemands(): DisasterDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDemands.slice(start, start + this.pageSize);
  }

  // 取得目前分頁後的志工資料
  get paginatedVolunteers(): VolunteerDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVolunteers.slice(start, start + this.pageSize);
  }

  // 取得目前資料總數（給分頁元件計算頁數用）
  get totalItems(): number {
    return this.type === 'material' ? this.filteredDemands.length : this.filteredVolunteers.length;
  }

  // 取得總頁數
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  // 取得分頁數字陣列
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // 切換到指定頁數
  goToPage(page: number) {
    this.currentPage = page;
  }
}
