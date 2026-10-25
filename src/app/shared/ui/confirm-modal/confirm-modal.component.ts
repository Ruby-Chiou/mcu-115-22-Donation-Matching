import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ConfirmModalMode = 'delete' | 'off-shelf' | 'blocked-on-shelf';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  @Input() mode: ConfirmModalMode = 'delete';
  @Input() message = '確定要刪除此筆需求嗎？';

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() alternate = new EventEmitter<void>();
}
