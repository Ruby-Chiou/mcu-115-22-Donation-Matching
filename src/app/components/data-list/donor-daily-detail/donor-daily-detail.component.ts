import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

@Component({
  selector: 'app-donor-daily-detail',
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './donor-daily-detail.component.html',
  styleUrl: './donor-daily-detail.component.scss',
})
export class DonorDailyDetailComponent implements OnInit {
  demand?: DailyDemand;

  constructor(
    private route: ActivatedRoute,
    private demandService: DailyDemandService
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.demand = this.demandService.getDemandById(id);

    console.log('目前需求：', this.demand);
  }

  // 取得接收方式文字
  getReceiveMethod(): string {
    if (!this.demand?.receiveMethod) return '';
    const methods = [];
    if (this.demand.receiveMethod.寄送) methods.push('寄送');
    if (this.demand.receiveMethod.面交) methods.push('面交');
    return methods.join('、');
  }

  // 取得服務對象文字
  getServiceTargets(): string {
    if (!this.demand?.serviceTargets) return '';
    const targets = [];
    for (const [key, value] of Object.entries(this.demand.serviceTargets)) {
      if (value) targets.push(key);
    }
    return targets.join('、') || '無';
  }
hasCustomConditions(): boolean {
  return (
    Array.isArray(this.demand?.customConditions) &&
    this.demand.customConditions.some(
      (condition: string) =>
        condition && condition.trim() !== ''
    )
  );
}
getPriorityClass(priority: string | undefined): string {
  switch (priority) {
    case '非常緊急':
      return 'priority-urgent';

    case '緊急':
      return 'priority-normal';

    case '普通':
      return 'priority-low';

    default:
      return 'priority-default';
  }
}
getRegion(address: string | undefined): string {
  if (!address) {
    return '';
  }

  const match = address.match(
    /^(.*?[縣市].*?[區鄉鎮市])/
  );

  return match ? match[1] : address;
}
}
