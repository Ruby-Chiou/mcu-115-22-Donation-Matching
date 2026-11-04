import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { dailyPriorityClass } from '../../../../core/demand/priority-class';
import { regionFromAddress } from '../../../../core/map/address-display';
import { DailyDemand } from '../../../../models/agency/daily-demand';

@Component({
  selector: 'app-donor-daily-card',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './donor-daily-card.component.html',
  styleUrl: './donor-daily-card.component.scss',
})
export class DonorDailyCardComponent {
  @Input() demand!: DailyDemand;

  @Output() view = new EventEmitter<void>();

  onView(): void {
    this.view.emit();
  }
  getPriorityClass(priority: string | undefined): string {
    return dailyPriorityClass(priority);
  }
  getRegion(address: string | undefined): string {
    return regionFromAddress(address);
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
