import { Component, DestroyRef, NgZone, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThanksMarqueeComponent } from './components/carousel/thanks-marquee/thanks-marquee.component';
import { AgencyAccessBannerComponent } from './components/agency/agency-access-banner.component';
import { GuidedTourComponent } from './components/guided-tour/guided-tour.component';
import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';
import { DisasterClosedModalService } from './core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from './core/services/disaster-control/disaster-control.service';
import { UiNoticeComponent } from './core/ui/ui-notice.component';
import { UiNoticeService, installUiNoticeBridge } from './core/ui/ui-notice.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ThanksMarqueeComponent,
    AgencyAccessBannerComponent,
    GuidedTourComponent,
    UiNoticeComponent,
  ],
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
  private readonly zone = inject(NgZone);
  private readonly uiNotice = inject(UiNoticeService);
  private hasReloadedAfterClose = false;

  constructor() {
    installUiNoticeBridge(this.uiNotice, (fn) => this.zone.run(fn));
    this.bindBackToTop();

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
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTo({ top: 0, behavior });
    document.body.scrollTo({ top: 0, behavior });
  }

  private bindBackToTop(): void {
    const readScrollY = () => {
      const scrolling = document.scrollingElement;
      return Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        scrolling?.scrollTop || 0,
      );
    };

    const sync = () => {
      const next = readScrollY() > 120;
      if (next === this.showBackToTop()) {
        return;
      }
      this.zone.run(() => this.showBackToTop.set(next));
    };

    this.zone.runOutsideAngular(() => {
      sync();
      const opts: AddEventListenerOptions = { passive: true };
      window.addEventListener('scroll', sync, opts);
      document.addEventListener('scroll', sync, { ...opts, capture: true });
      document.addEventListener('touchmove', sync, opts);
      window.addEventListener('resize', sync, opts);
      window.visualViewport?.addEventListener('scroll', sync, opts);
      window.visualViewport?.addEventListener('resize', sync, opts);
      const poll = window.setInterval(sync, 400);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', sync);
        document.removeEventListener('scroll', sync, true);
        document.removeEventListener('touchmove', sync);
        window.removeEventListener('resize', sync);
        window.visualViewport?.removeEventListener('scroll', sync);
        window.visualViewport?.removeEventListener('resize', sync);
        window.clearInterval(poll);
      });
    });
  }
}
