import { Component, Input, OnInit } from '@angular/core';

import { DonorDisasterCardComponent } from '../../../card/disaster/donor-disaster-card/donor-disaster-card.component';
import { PaginationComponent } from '../../../pagination/pagination.component';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { DisasterControlService } from '../../../../core/services/disaster-control.service';

import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';

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
  standalone: true,
  imports: [DonorDisasterCardComponent, PaginationComponent],
  templateUrl: './donor-disaster-card-list.component.html',
  styleUrl: './donor-disaster-card-list.component.scss',
})
export class DonorDisasterCardListComponent implements OnInit {
  @Input() type: 'material' | 'volunteer' = 'material';

  @Input() filters: DisasterFilters = {
    category: [],
    priority: [],
    hasRemaining: false,
  };

  protected disasterData!: DisasterControlService['data'];

  demands: DisasterDemand[] = [];
  volunteers: VolunteerDemand[] = [];

  currentPage = 1;
  pageSize = 8;

  constructor(
    private readonly disasterDemandService: DisasterDemandService,
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly disasterControlService: DisasterControlService
  ) {
    this.disasterData = this.disasterControlService.data;
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.disasterDemandService.waitUntilLoaded(), this.volunteerDemandService.waitUntilLoaded()]);

    this.loadDemands();
  }

  private loadDemands(): void {
    this.demands = this.disasterDemandService.getDemands().filter((demand) => demand.status === '上架');

    this.volunteers = this.volunteerDemandService.getVolunteers().filter((volunteer) => volunteer.status === '上架');

    this.currentPage = 1;
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

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  get paginatedDemands(): DisasterDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredDemands.slice(start, start + this.pageSize);
  }

  get paginatedVolunteers(): VolunteerDemand[] {
    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredVolunteers.slice(start, start + this.pageSize);
  }

  get totalItems(): number {
    return this.type === 'material' ? this.filteredDemands.length : this.filteredVolunteers.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from(
      {
        length: this.totalPages,
      },
      (_, i) => i + 1
    );
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
