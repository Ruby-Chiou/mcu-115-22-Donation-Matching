import { Component, DestroyRef, NgZone, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThanksMarqueeComponent } from './components/carousel/thanks-marquee/thanks-marquee.component';
import { DisasterBroadcastMarqueeComponent } from './components/carousel/disaster-broadcast-marquee/disaster-broadcast-marquee.component';
import { AgencyAccessBannerComponent } from './components/agency/agency-access-banner.component';
import { GuidedTourComponent } from './components/guided-tour/guided-tour.component';
import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';
import { ChromeVisibilityService } from './core/layout/chrome-visibility.service';
import { DisasterClosedModalService } from './core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from './core/services/disaster-control/disaster-control.service';
import { isDonorDisasterActionUrl, isDonorDisasterAreaUrl } from './core/services/disaster-control/disaster-session.util';
import { UiNoticeComponent } from './core/ui/ui-notice.component';
import { UiNoticeService, installUiNoticeBridge } from './core/ui/ui-notice.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ThanksMarqueeComponent,
    DisasterBroadcastMarqueeComponent,
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
  protected readonly chrome = inject(ChromeVisibilityService);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly disasterControl = inject(DisasterControlService);
  private readonly zone = inject(NgZone);
  private readonly uiNotice = inject(UiNoticeService);

  constructor() {
    installUiNoticeBridge(this.uiNotice, (fn) => this.zone.run(fn));
    this.bindBackToTop();
    this.watchDisasterClose();
    this.blockClosedDisasterActions();
  }

  goToDisasterLobby(): void {
    this.closedModal.hide();
    void this.router.navigateByUrl('/donor/disaster');
  }

  /** 災害一關閉：立刻跳出提示，並強制退出詳情／表單等捐助動作頁（不依賴重整）。 */
  private watchDisasterClose(): void {
    let seenCloseBroadcast = this.disasterControl.closeBroadcast();

    effect(() => {
      const closeBroadcast = this.disasterControl.closeBroadcast();
      if (closeBroadcast === seenCloseBroadcast) {
        return;
      }
      seenCloseBroadcast = closeBroadcast;

      if (this.disasterControl.data().isOpen) {
        return;
      }

      const url = this.router.url;
      if (!isDonorDisasterAreaUrl(url)) {
        return;
      }

      this.closedModal.show();
      if (isDonorDisasterActionUrl(url)) {
        void this.router.navigateByUrl('/donor/disaster');
      }
    });
  }

  /** 關閉後若仍停在災害專區，攔截捐助相關操作並再顯示提示。 */
  private blockClosedDisasterActions(): void {
    const blockEvent = (event: Event) => {
      if (this.disasterControl.data().isOpen) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target || target.closest('.disaster-closed-modal, .disaster-closed-modal-backdrop')) {
        return;
      }

      const url = this.router.url;
      if (!isDonorDisasterAreaUrl(url)) {
        return;
      }

      // 動作頁理論上已被踢回大廳；若還留著，任何互動都強制退出。
      if (isDonorDisasterActionUrl(url)) {
        event.preventDefault();
        event.stopPropagation();
        this.closedModal.show();
        void this.router.navigateByUrl('/donor/disaster');
        return;
      }

      // 大廳：仍可看地圖／公告，但擋下捐助相關按鈕與連結。
      if (target.closest('#disaster-map-section, .map-button')) {
        return;
      }

      const interactive = target.closest('button, a, input, textarea, select, [role="button"]');
      if (!interactive) {
        return;
      }

      const isDonationControl =
        target.closest('.donor-disaster-page, .featured-card, .detail-btn, .contact-btn, app-donor-disaster-card-list') ||
        (interactive instanceof HTMLAnchorElement && (interactive.getAttribute('href') || '').includes('/donor/disaster/'));

      if (!isDonationControl) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.closedModal.show();
    };

    document.addEventListener('click', blockEvent, true);
    document.addEventListener('submit', blockEvent, true);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', blockEvent, true);
      document.removeEventListener('submit', blockEvent, true);
    });
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
