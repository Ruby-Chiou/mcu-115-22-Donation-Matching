import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { UiNoticeKind, UiNoticeService, UiNoticeState } from './ui-notice.service';

@Component({
  selector: 'app-ui-notice',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ui-notice.component.html',
  styleUrl: './ui-notice.component.scss',
})
export class UiNoticeComponent {
  readonly notices = inject(UiNoticeService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const active = this.notices.active();
    if (!active) {
      return;
    }
    this.cancel(active.kind);
  }

  updateInput(value: string): void {
    const current = this.notices.active();
    if (!current || current.kind !== 'prompt') {
      return;
    }
    this.notices.active.set({ ...current, inputValue: value });
  }

  onBackdrop(kind: UiNoticeKind): void {
    this.cancel(kind);
  }

  cancel(kind: UiNoticeKind): void {
    if (kind === 'prompt') {
      this.notices.close(null);
      return;
    }
    this.notices.close(kind === 'confirm' ? false : true);
  }

  confirm(dialog: UiNoticeState): void {
    if (dialog.kind === 'prompt') {
      this.notices.close(dialog.inputValue);
      return;
    }
    this.notices.close(true);
  }
}
