import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-volunteer-search-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteer-search-bar.component.html',
  styleUrl: './volunteer-search-bar.component.scss',
})
export class VolunteerSearchBarComponent {
  @Input() searchTerm = '';

  @Output() searchChange = new EventEmitter<string>();

  onSearch() {
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchChange.emit(this.searchTerm);
  }
}
