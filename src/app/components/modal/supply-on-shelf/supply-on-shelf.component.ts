import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-supply-on-shelf',
  standalone: true,
  imports: [],
  templateUrl: './supply-on-shelf.component.html',
  styleUrl: './supply-on-shelf.component.scss',
})
export class SupplyOnShelfComponent {
  // 關閉視窗
  @Output() closed = new EventEmitter<void>();

  // 確認
  @Output() confirmed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }

  confirm() {
    this.confirmed.emit();
  }
}
