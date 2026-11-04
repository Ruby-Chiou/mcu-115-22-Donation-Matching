import { Component, EventEmitter, Input, Output } from '@angular/core';

/** 受助者編輯表單共用的離開確認（SRP：只負責未儲存離開對話）。 */
@Component({
  selector: 'app-leave-unsaved-modal',
  standalone: true,
  templateUrl: './leave-unsaved-modal.component.html',
  styleUrl: './leave-unsaved-modal.component.scss',
})
export class LeaveUnsavedModalComponent {
  @Input() saveDisabled = false;

  @Output() stay = new EventEmitter<void>();
  @Output() leave = new EventEmitter<void>();
  @Output() saveAndLeave = new EventEmitter<void>();
}
