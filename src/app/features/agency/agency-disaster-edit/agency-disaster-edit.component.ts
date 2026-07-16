import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-edit',
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-disaster-edit.component.html',
  styleUrl: './agency-disaster-edit.component.scss',
})
export class AgencyDisasterEditComponent implements OnInit {
  demand: any = {};

  constructor(
    private route: ActivatedRoute,
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const data = this.service.getDemands().find((item) => item.id === id);

    if (data) {
      this.demand = { ...data };
    }
  }

  save() {
    this.service.updateDemand(this.demand);

    this.router.navigate(['/agency/disaster-post']);
  }
}
