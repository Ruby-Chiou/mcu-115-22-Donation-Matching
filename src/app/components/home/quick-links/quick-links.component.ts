import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DisasterClosedModalService } from '../../../core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-quick-links',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quick-links.component.html',
  styleUrl: './quick-links.component.scss',
})
export class HomeQuickLinksComponent {
  private readonly router = inject(Router);
  private readonly disaster = inject(DisasterControlService);
  private readonly closedModal = inject(DisasterClosedModalService);

  protected goToDisaster(event: Event): void {
    event.preventDefault();

    if (!this.disaster.data().isOpen) {
      this.closedModal.show();
      return;
    }

    void this.router.navigate(['/donor/disaster']);
  }
}
