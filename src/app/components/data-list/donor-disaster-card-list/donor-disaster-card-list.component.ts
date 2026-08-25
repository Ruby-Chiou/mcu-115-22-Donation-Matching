import { Component, Input } from '@angular/core';
import { DonorDisasterCardComponent } from '../../card/donor-disaster-card/donor-disaster-card.component';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

@Component({
  selector: 'app-donor-disaster-card-list',
  imports: [DonorDisasterCardComponent],
  templateUrl: './donor-disaster-card-list.component.html',
  styleUrl: './donor-disaster-card-list.component.scss',
})
export class DonorDisasterCardListComponent {
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
