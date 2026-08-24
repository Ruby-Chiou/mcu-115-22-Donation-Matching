import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

@Component({
  selector: 'app-disaster-open-card',
  imports: [DecimalPipe],
  templateUrl: './disaster-open-card.component.html',
  styleUrl: './disaster-open-card.component.scss',
})
export class DisasterOpenCardComponent {
  @Input() type: 'material' | 'volunteer' = 'material';
  @Input() demand?: DailyDemand;
  @Input() volunteer?: VolunteerDemand;
  @Input() demandId?: number;
  showDetail = false;
  progress = 50;
  constructor( private router: Router  ) {}

  // 點整張卡片
  goToFullDetail(event: Event) {
    event.stopPropagation();
    // 關閉彈跳視窗
    this.showDetail = false;
    // 物資

    if (this.type === 'material') {
    this.router.navigate(['/disaster/open/detail', this.demandId]);
    return;
    }
    // 志工
    if (this.type === 'volunteer') {
    this.router.navigate(['/disaster/open/volunteer/detail', this.volunteer?.id]);
    return;
    }
}

  // 點「了解詳情」
  openDetail(event: Event) {
    event.stopPropagation();
    this.showDetail = true;

  }

  getCollectedAmount(): number {
    return Math.max((this.demand?.amount ?? 0) - (this.demand?.remaining ?? 0), 0);
  }

  getProgress(): number {
    const amount = this.demand?.amount ?? 0;
    return amount > 0 ? Math.min((this.getCollectedAmount() / amount) * 100, 100) : 0;
  }

  getPriorityClass(): string {
    switch (this.demand?.priority) {
      case '非常緊急':
        return 'very-urgent';
      case '緊急':
        return 'urgent';
      default:
        return 'normal';
    }
  }
  // 關閉彈跳視窗
  closeDetail(event?: Event) {
    event?.stopPropagation();
    this.showDetail = false;
  }

}
