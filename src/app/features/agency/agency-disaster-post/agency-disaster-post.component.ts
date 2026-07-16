import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-post',
  imports: [CommonModule, RouterLink],
  templateUrl: './agency-disaster-post.component.html',
  styleUrl: './agency-disaster-post.component.scss',
})
export class AgencyDisasterPostComponent implements OnInit {
  demands: any[] = [];

  constructor(private disasterDemandService: DisasterDemandService) {}

  ngOnInit() {
    this.demands = this.disasterDemandService.getDemands();
  }

  deleteDemand(id: number) {
    const confirmDelete = confirm('是否確認要刪除？');

    if (confirmDelete) {
      this.disasterDemandService.deleteDemand(id);

      this.demands = this.disasterDemandService.getDemands();
    }
  }
}
