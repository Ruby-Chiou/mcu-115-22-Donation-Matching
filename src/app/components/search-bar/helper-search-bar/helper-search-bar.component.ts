import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-helper-search-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './helper-search-bar.component.html',
  styleUrl: './helper-search-bar.component.scss',
})
export class HelperSearchBarComponent {
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
