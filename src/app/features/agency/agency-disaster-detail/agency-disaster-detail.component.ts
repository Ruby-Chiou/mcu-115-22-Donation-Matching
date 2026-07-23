import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.demand = this.service.getDemandById(id);

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount;

      this.demand.customConditions ??= [];
    }
  }

  // 判斷接受 / 不接受顏色
  getConditionClass(condition: string) {
    if (condition === '接受') {
      return 'accept';
    }

    if (condition === '不接受') {
      return 'reject';
    }

    return '';
  }

  // 顯示符號
  getConditionIcon(condition: string) {
    if (condition === '接受') {
      return '✔';
    }

    if (condition === '不接受') {
      return '✘';
    }

    return '';
  }

  deleteDemand() {
    const confirmDelete = confirm('確定要刪除此筆急難需求嗎？');

    if (!confirmDelete) {
      return;
    }

    this.service.deleteDemand(this.demand.id);

    this.router.navigate(['/agency/disaster']);
  }
}
