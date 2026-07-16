import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './agency-disaster-detail.component.html',
  styleUrl: './agency-disaster-detail.component.scss',
})
export class AgencyDisasterDetailComponent {
  demand: any;

  constructor(
    private route: ActivatedRoute,
    private service: DisasterDemandService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.demand = this.service.getDemandById(id);
  }
}
