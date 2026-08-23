import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';
import { DisasterClosedModalService } from './core/services/disaster-closed-modal.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly title = signal('donation-matching');
  protected readonly closedModal: DisasterClosedModalService = inject(DisasterClosedModalService);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const blockClosedDisasterClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isClosed = localStorage.getItem('disasterOpen') !== 'true';
      const isDisasterOpenPage = this.router.url.startsWith('/disaster/open');
      const isInteractiveControl = target?.closest(
        'button, a, input, textarea, select, [role="button"]'
      );

      if (
        isClosed &&
        isDisasterOpenPage &&
        isInteractiveControl &&
        !target?.closest('.disaster-closed-modal')
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.closedModal.show();
      }
    };

    document.addEventListener('click', blockClosedDisasterClick, true);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', blockClosedDisasterClick, true);
    });
  }

  goToDisasterLobby(): void {
    this.closedModal.hide();
    this.router.navigate(['/donor/disaster']);
  }
}
