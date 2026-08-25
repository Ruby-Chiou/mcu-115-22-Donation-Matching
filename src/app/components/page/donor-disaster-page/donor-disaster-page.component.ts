import { Component, signal } from '@angular/core';
import { DonorDisasterCardListComponent } from '../../data-list/donor-disaster-card-list/donor-disaster-card-list.component';

@Component({
  selector: 'app-donor-disaster-page',
  imports: [DonorDisasterCardListComponent],
  templateUrl: './donor-disaster-page.component.html',
  styleUrl: './donor-disaster-page.component.scss',
})
export class DonorDisasterPageComponent {
  protected readonly activeType = signal<'material' | 'volunteer'>('material');

  protected selectType(type: 'material' | 'volunteer'): void {
    this.activeType.set(type);
  }

  protected goToMap(): void {
    document.getElementById('disaster-map-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
