import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DisasterDemand } from '../../../models/agency/demand';
import { VolunteerDemand } from '../../../models/agency/vdemand';

import { DisasterControlService } from '../../../core/services/disaster-control.service';

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

  protected readonly disasterData =
    inject(DisasterControlService).data;

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
        : ['donor/disaster/volunteer/detail', this.volunteer?.id]
    );
  }

  closeDetail(event?: Event): void {
    event?.stopPropagation();
    this.showDetail = false;
  }

  getPriorityClass(): string {
    return this.demand?.priority === '非常緊急'
      ? 'very-urgent'
      : this.demand?.priority === '緊急'
        ? 'urgent'
        : 'normal';
  }

  currentImageIndex = 0;

  private imageInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.imageInterval = setInterval(() => {

      // ⭐ 你的 Service 欄位叫 image，不是 images
      const images = this.demand?.image ?? [];

      if (images.length > 1) {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % images.length;
      }

    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
  }
}
