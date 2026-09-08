import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supply-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supply-search-bar.component.html',
  styleUrls: ['./supply-search-bar.component.scss'],
})
export class SupplySearchBarComponent {
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
