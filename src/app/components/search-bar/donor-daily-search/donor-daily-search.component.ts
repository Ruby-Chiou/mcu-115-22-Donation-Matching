import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-donor-daily-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './donor-daily-search.component.html',
  styleUrl: './donor-daily-search.component.scss',
})
export class DonorDailySearchComponent {
   keyword = '';

  @Output() searchChange =
    new EventEmitter<string>();

  search(): void {
    this.searchChange.emit(
      this.keyword.trim()
    );
  }
}
