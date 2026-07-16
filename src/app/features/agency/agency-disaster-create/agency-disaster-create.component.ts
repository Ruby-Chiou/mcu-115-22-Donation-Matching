import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-create',
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-disaster-create.component.html',
  styleUrl: './agency-disaster-create.component.scss',
})
export class AgencyDisasterCreateComponent {
  demand = {
    item: '',
    amount: '',
    remaining: '',
    reason: '',
    priority: '普通',
    address: '',
    phone: '',
    note: '',
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router
  ) {}

  save() {
    this.disasterDemandService.addDemand(this.demand);

    this.router.navigate(['/agency/disaster-post']);
  }
}
