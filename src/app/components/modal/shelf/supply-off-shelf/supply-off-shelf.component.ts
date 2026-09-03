import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-supply-off-shelf',
  standalone: true,
  imports: [],
  templateUrl: './supply-off-shelf.component.html',
  styleUrl: './supply-off-shelf.component.scss',
})
export class SupplyOffShelfComponent {
  // 關閉視窗
  @Output() closed = new EventEmitter<void>();

  // 選擇隱藏
  @Output() hide = new EventEmitter<void>();

  // 確認手動下架
  @Output() confirmed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }

  hideInstead() {
    this.hide.emit();
  }

  confirm() {
    this.confirmed.emit();
  }
}
