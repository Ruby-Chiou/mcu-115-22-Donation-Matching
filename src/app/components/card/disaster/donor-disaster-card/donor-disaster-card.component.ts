import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';

import { DisasterControlService } from '../../../../core/services/disaster-control.service';

@Component({
  selector: 'app-donor-disaster-card',
  imports: [],
  templateUrl: './donor-disaster-card.component.html',
  styleUrl: './donor-disaster-card.component.scss',
})
export class DonorDisasterCardComponent {
  @Input() type: 'material' | 'volunteer' = 'material';

  // ⭐ 物資改成 DisasterDemand
  @Input() demand?: DisasterDemand;

  @Input() volunteer?: VolunteerDemand;

  @Input() demandId?: number;

  showDetail = false;

  protected readonly disasterData = inject(DisasterControlService).data;

  constructor(private router: Router) {}

  get isDisasterClosed(): boolean {
    return !this.disasterData().isOpen;
  }

  openDetail(event: Event): void {
    event.stopPropagation();

    if (!this.isDisasterClosed) {
      this.showDetail = true;
    }
  }

  goToFullDetail(event: Event): void {
    event.stopPropagation();

    if (this.isDisasterClosed) return;

    this.showDetail = false;

    this.router.navigate(
      this.type === 'material'
        ? ['donor/disaster/supply/detail', this.demandId]
        : ['donor/disaster/volunteer/detail', this.volunteer?.serialNo]
    );
  }

  closeDetail(event?: Event): void {
    event?.stopPropagation();
    this.showDetail = false;
  }

  getPriorityClass(): string {
    return this.demand?.priority === '非常緊急' ? 'very-urgent' : this.demand?.priority === '緊急' ? 'urgent' : 'normal';
  }

  currentImageIndex = 0;

  previousImage(event: Event): void {
    event.stopPropagation();

    if (!this.demand?.image?.length) return;

    this.currentImageIndex = this.currentImageIndex === 0 ? this.demand.image.length - 1 : this.currentImageIndex - 1;
  }

  nextImage(event: Event): void {
    event.stopPropagation();

    if (!this.demand?.image?.length) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % this.demand.image.length;
  }
}
