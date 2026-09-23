import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-base',
  standalone: true,
  templateUrl: './list-base.component.html',
  styleUrls: ['./list-base.component.scss'],
  imports: [CommonModule, PaginationComponent],
})
export class ListBaseComponent<T> {
  @Input() items: T[] = [];
  @Input() isLoading = false;
  @Input() pageSize = 8;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.items.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedItems(): T[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }
}
