import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-donor-daily-card',
  standalone: true,
  templateUrl: './donor-daily-card.component.html',
  styleUrl: './donor-daily-card.component.scss'
})
export class DonorDailyCardComponent {

  @Input() id!: number;
  @Input() title = '';
  @Input() category = '';
  @Input() target = '';
  @Input() quantity = 0;
  @Input() organization = '';
  @Input() address = '';
  @Input() image = '';

  @Output() view = new EventEmitter<void>();

  onView(): void {
    this.view.emit();
  }
}
