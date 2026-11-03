import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DisasterControlService } from './disaster-control.service';

@Injectable({ providedIn: 'root' })
export class DisasterClosedModalService {
  private readonly disaster = inject(DisasterControlService);
  private readonly router = inject(Router);

  readonly isVisible = signal(false);

  show(): void {
    this.isVisible.set(true);
  }

  hide(): void {
    this.isVisible.set(false);
  }

  /**
   * 災害已關閉時：跳出提示、導回大廳，並回傳 true 讓呼叫端中止捐助動作。
   */
  blockIfClosed(): boolean {
    if (this.disaster.data().isOpen) {
      return false;
    }

    this.show();
    void this.router.navigateByUrl('/donor/disaster');
    return true;
  }
}
