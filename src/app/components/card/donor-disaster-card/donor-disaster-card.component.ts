import { Component, Input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';
import { DisasterControlService } from '../../../core/services/disaster-control.service';

@Component({
  selector: 'app-donor-disaster-card',
  imports: [DecimalPipe],
  templateUrl: './donor-disaster-card.component.html',
  styleUrl: './donor-disaster-card.component.scss',
})
export class DonorDisasterCardComponent {
  @Input() type: 'material' | 'volunteer' = 'material';
  @Input() demand?: DailyDemand;
  @Input() volunteer?: VolunteerDemand;
  @Input() demandId?: number;
  showDetail = false;
  protected readonly disasterData = inject(DisasterControlService).data;

  constructor(private router: Router) {}

  get isDisasterClosed(): boolean { return !this.disasterData().isOpen; }

  openDetail(event: Event): void {
    event.stopPropagation();
    if (!this.isDisasterClosed) this.showDetail = true;
  }

  goToFullDetail(event: Event): void {
    event.stopPropagation();
    if (this.isDisasterClosed) return;
    this.showDetail = false;
    this.router.navigate(this.type === 'material'
      ? ['/disaster/open/detail', this.demandId]
      : ['/disaster/open/volunteer/detail', this.volunteer?.id]);
  }

  closeDetail(event?: Event): void {
    event?.stopPropagation();
    this.showDetail = false;
  }

  getCollectedAmount(): number { return Math.max((this.demand?.amount ?? 0) - (this.demand?.remaining ?? 0), 0); }
  getProgress(): number {
    const amount = this.demand?.amount ?? 0;
    return amount > 0 ? Math.min((this.getCollectedAmount() / amount) * 100, 100) : 0;
  }
  getPriorityClass(): string {
    return this.demand?.priority === '非常緊急' ? 'very-urgent' : this.demand?.priority === '緊急' ? 'urgent' : 'normal';
  }
}
