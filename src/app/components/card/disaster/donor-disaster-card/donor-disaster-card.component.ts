import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { HelperDemand } from '../../../../models/agency/helper-demand';

import { DisasterControlService } from '../../../../core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-donor-disaster-card',
  imports: [NgClass],
  templateUrl: './donor-disaster-card.component.html',
  styleUrl: './donor-disaster-card.component.scss',
})
export class DonorDisasterCardComponent {
  @Input() type: 'material' | 'helper' = 'material';

  // ⭐ 物資改成 DisasterDemand
  @Input() demand?: DisasterDemand;

  @Input() helper?: HelperDemand;

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

    if (this.isDisasterClosed) {
      return;
    }

    this.showDetail = false;

    if (this.type === 'material') {
      const id = this.demand?.id;

      console.log('[災害物資] 前往詳細頁資料庫 id：', id);

      if (id == null) {
        console.error('災害物資缺少資料庫 id：', this.demand);

        return;
      }

      void this.router.navigate(['/donor/disaster/supply/detail', id]);

      return;
    }

    const id = this.helper?.id;

    console.log('[災害協力] 前往詳細頁資料庫 id：', id);

    if (id == null) {
      console.error('災害協力缺少資料庫 id：', this.helper);

      return;
    }

    void this.router.navigate(['/donor/disaster/helper/detail', id]);
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
