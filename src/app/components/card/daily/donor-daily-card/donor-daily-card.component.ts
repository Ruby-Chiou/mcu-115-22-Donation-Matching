import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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

    const match = address.match(/^(.*?[縣市].*?[區鄉鎮市])/);

    return match ? match[1] : address;
  }
}
