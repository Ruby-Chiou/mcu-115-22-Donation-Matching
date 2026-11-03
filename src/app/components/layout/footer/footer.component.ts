import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { DisasterClosedModalService } from '../../../core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly auth = inject(AuthSessionService);
  private readonly disaster = inject(DisasterControlService);
  private readonly closedModal = inject(DisasterClosedModalService);

  protected get signedIn(): boolean {
    return this.auth.principal().role !== 'guest';
  }

  protected onDisasterLink(event: Event): void {
    if (this.disaster.data().isOpen) {
      return;
    }
    event.preventDefault();
    this.closedModal.show();
  }
}
