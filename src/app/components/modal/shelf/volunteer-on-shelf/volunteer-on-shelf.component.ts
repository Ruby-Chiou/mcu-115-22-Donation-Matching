import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-volunteer-on-shelf',
  imports: [],
  templateUrl: './volunteer-on-shelf.component.html',
  styleUrl: './volunteer-on-shelf.component.scss',
})
export class VolunteerOnShelfComponent {
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
