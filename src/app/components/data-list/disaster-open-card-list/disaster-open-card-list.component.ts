import { Component, Input } from '@angular/core';
import {
  DisasterOpenCardComponent,
} from '../../../components/card/disaster-open-card/disaster-open-card.component';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

@Component({
  selector: 'app-disaster-open-card-list',
  imports: [DisasterOpenCardComponent],
  templateUrl: './disaster-open-card-list.component.html',
  styleUrl: './disaster-open-card-list.component.scss',
})
export class DisasterOpenCardListComponent {
  @Input() type: 'material' | 'volunteer' = 'material';
  demands: DailyDemand[];
  volunteers: VolunteerDemand[];

  constructor(
    private dailyDemandService: DailyDemandService,
    private volunteerDemandService: VolunteerDemandService
  ) {
    this.demands = this.dailyDemandService
      .getDemands()
      .filter((demand) => demand.status === '上架');
    this.volunteers = this.volunteerDemandService.getVolunteers();
  }
}
