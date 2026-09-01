import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-daily-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-search-bar.component.html',
  styleUrl: './daily-search-bar.component.scss',
})
export class DailySearchBarComponent {
  @Input() searchTerm = '';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  onInput() {
    this.searchTermChange.emit(this.searchTerm);
    this.search.emit();
  }

  onSearch() {
    this.searchTermChange.emit(this.searchTerm);
    this.search.emit();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchTermChange.emit(this.searchTerm);
    this.clear.emit();
  }
}
