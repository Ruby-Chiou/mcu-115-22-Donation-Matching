import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  // 每頁顯示幾筆
  @Input() pageSize = 10;

  // 目前第幾頁
  @Input() currentPage = 1;

  // 總共有幾頁
  @Input() totalPages = 1;

  // 頁碼
  @Input() pageNumbers: number[] = [];

  // 點擊頁碼時通知父元件
  @Output() pageChange = new EventEmitter<number>();

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
