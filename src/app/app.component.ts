import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThanksMarqueeComponent } from './components/carousel/thanks-marquee/thanks-marquee.component';
import { AgencyAccessBannerComponent } from './components/agency/agency-access-banner.component';
import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';
import { DisasterClosedModalService } from './core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from './core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ThanksMarqueeComponent, AgencyAccessBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly title = signal('donation-matching');
  protected readonly showBackToTop = signal(false);
  protected readonly closedModal: DisasterClosedModalService = inject(DisasterClosedModalService);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly disasterControl = inject(DisasterControlService);
  private hasReloadedAfterClose = false;

  constructor() {
    const onScroll = () => this.showBackToTop.set(window.scrollY > 480);
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));

    let previousClosedAt = this.disasterControl.data().closedAt;
    effect(() => {
      const closedAt = this.disasterControl.data().closedAt;
      const wasJustClosed = closedAt !== null && closedAt !== previousClosedAt;
      previousClosedAt = closedAt;

      if (
        wasJustClosed &&
        !this.hasReloadedAfterClose &&
        (this.router.url === '/donor/disaster' || this.router.url.startsWith('/disaster/open'))
      ) {
        this.hasReloadedAfterClose = true;
        this.closedModal.show();
        window.setTimeout(() => window.location.reload(), 2500);
      }
    });

    const blockClosedDisasterClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('#disaster-map-section')) {
        return;
      }

      const isClosed = localStorage.getItem('disasterOpen') !== 'true';
      const isDisasterOpenPage = this.router.url.startsWith('/disaster/open') || this.router.url === '/donor/disaster';
      const isInteractiveControl = target?.closest('button, a, input, textarea, select, [role="button"]');
      const isDisasterControl =
        (target?.closest('.donor-disaster-page') || this.router.url.startsWith('/disaster/open')) && !target?.closest('.map-button');

      if (isClosed && isDisasterOpenPage && isInteractiveControl && isDisasterControl && !target?.closest('.disaster-closed-modal')) {
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

  protected backToTop(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
