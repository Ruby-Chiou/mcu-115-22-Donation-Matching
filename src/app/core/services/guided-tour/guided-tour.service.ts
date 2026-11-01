import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthSessionService } from '../auth/auth-session.service';

export type TourAudience = 'guest' | 'agency';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector used to place the coachmark near a control. */
  anchor: string;
  /** Optional route to open before highlighting. */
  route?: string;
  /** Open mobile hamburger / force desktop dropdown open. */
  openNav?: boolean;
  /** If tip is too long conceptually, send user to intro page. */
  preferIntroPage?: boolean;
}

const GUEST_STEPS: TourStep[] = [
  {
    id: 'intro',
    title: '這個平台在做什麼？',
    body: '智慧捐助媒合平台只媒合實體物資，協助捐助者對接受助機構的日常與災害需求。細節較多，先帶你到介紹頁看概要。',
    anchor: 'h1, .intro-title, [data-tour="guest-intro-page"]',
    route: '/intro',
    preferIntroPage: true,
  },
  {
    id: 'donate-area',
    title: '捐助專區',
    body: '上方導覽的「捐助專區」可進入日常捐助、災害救助、捐助地圖與受助機構。手機請先打開選單再點這一區。',
    anchor: '[data-tour="guest-donate-area"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'daily',
    title: '日常捐助',
    body: '日常物資需求在這裡瀏覽，可用緊急度與最新上架排序，也能用篩選縮小範圍。',
    anchor: '[data-tour="guest-daily"], a[href="/donor/daily"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'about-nav',
    title: '平台介紹與導覽',
    body: '「關於我們」裡有平台介紹與平台導覽，適合第一次使用時慢慢看完整流程說明。',
    anchor: '[data-tour="guest-about-area"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'guide',
    title: '平台導覽頁',
    body: '這頁用角色說明怎麼捐、怎麼提需求。之後若忘記流程，可再從導覽列進來。',
    anchor: 'a[href="/platform-guide"], [data-tour="guest-guide"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'faq',
    title: '常見問題',
    body: '客服中心的「常見問題」整理了收據、物流、協力者等常見疑惑，可先查這裡。',
    anchor: '[data-tour="guest-service-area"], a[href="/customer-service/faq"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'ai',
    title: 'AI 客服',
    body: '操作上有疑問可問 AI 智慧客服，例如捐贈證明、協力需求或物流怎麼填。',
    anchor: 'a[href="/customer-service/ai-chat"]',
    route: '/home',
    openNav: true,
  },
  {
    id: 'login',
    title: '登入／註冊',
    body: '要實際捐助、留言或查看紀錄時再登入即可。可用信箱密碼，或 Google、LINE、Facebook。',
    anchor: '[data-tour="guest-login"], a[href="/login"], .nav-login',
    route: '/home',
  },
];

const AGENCY_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: '總控制台',
    body: '登入後會進到這裡，可看日常／災害摘要與平台通知。',
    anchor: '[data-tour="agency-dashboard"], a[href="/agency/dashboard"]',
    route: '/agency/dashboard',
  },
  {
    id: 'daily',
    title: '日常需求',
    body: '在這裡新增、編輯、上下架日常物資。緊急度與公開狀態會影響前台排序與曝光。',
    anchor: 'a[href="/agency/daily"]',
    route: '/agency/dashboard',
    openNav: true,
  },
  {
    id: 'review',
    title: '物資審核',
    body: '捐助者送出物資後，到這裡審核通過、退回或要求補件。',
    anchor: 'a[href="/agency/item-review"]',
    route: '/agency/dashboard',
    openNav: true,
  },
  {
    id: 'delivery',
    title: '收件確認',
    body: '物資寄達後，在「收件確認」核對物流與簽收，完成收貨流程。',
    anchor: 'a[href="/agency/delivery-confirm"]',
    route: '/agency/dashboard',
    openNav: true,
  },
  {
    id: 'receipt',
    title: '收據與感謝',
    body: '審核通過後可開立收據並上傳感謝狀，完成對捐助者的回饋。',
    anchor: 'a[href="/agency/receipt-review"]',
    route: '/agency/dashboard',
    openNav: true,
  },
  {
    id: 'disaster',
    title: '災害救助',
    body: '災害相關作業入口在這裡。是否開放由管理者控管；關閉時前台與機構都無法進行新的災害捐助或協力報名。',
    anchor: '[data-tour="agency-disaster"], a[href="/agency/disaster"]',
    route: '/agency/dashboard',
    openNav: true,
  },
];

const GUEST_DONE_KEY = 'dm-tour-guest-done';
const AGENCY_DONE_KEY = 'dm-tour-agency-done';
const GUEST_SKIP_SESSION = 'dm-tour-guest-skip';
const AGENCY_SKIP_SESSION = 'dm-tour-agency-skip';

@Injectable({ providedIn: 'root' })
export class GuidedTourService {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);

  private readonly promptOpen = signal(false);
  private readonly active = signal(false);
  private readonly audience = signal<TourAudience>('guest');
  private readonly stepIndex = signal(0);
  private readonly highlightSelector = signal('');
  private readonly forceMenuOpen = signal(false);
  private readonly forceDropdown = signal('');

  readonly showPrompt = computed(() => this.promptOpen());
  readonly isActive = computed(() => this.active());
  readonly currentAudience = computed(() => this.audience());
  readonly highlighted = computed(() => this.highlightSelector());
  readonly menuForcedOpen = computed(() => this.forceMenuOpen());
  readonly dropdownForced = computed(() => this.forceDropdown());
  readonly currentStep = computed(() => {
    const steps = this.stepsFor(this.audience());
    return steps[this.stepIndex()] ?? null;
  });
  readonly stepNumber = computed(() => this.stepIndex() + 1);
  readonly stepTotal = computed(() => this.stepsFor(this.audience()).length);

  constructor() {
    this.migrateLegacyKeys();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      void this.auth.restore().then(() => {
        this.handleTourQuery();
        this.maybeOfferTour();
        if (this.active()) {
          void this.prepareCurrentStep();
        }
      });
    });

    effect(() => {
      const role = this.auth.principal().role;
      if (role === 'donor' || role === 'admin') {
        queueMicrotask(() => this.abortForRole());
        return;
      }
      if (role === 'agency' || role === 'guest') {
        queueMicrotask(() => this.maybeOfferTour());
      }
    });

    void this.auth.restore().then(() => {
      this.handleTourQuery();
      this.maybeOfferTour();
    });
  }

  /** 捐助者／管理者不顯示導覽；身分不符時立刻關掉。 */
  private abortForRole(): void {
    this.promptOpen.set(false);
    this.clearHighlight();
    this.active.set(false);
  }

  private allowsTour(audience: TourAudience): boolean {
    const role = this.auth.principal().role;
    if (role === 'donor' || role === 'admin') {
      return false;
    }
    if (audience === 'agency') {
      return role === 'agency';
    }
    return role === 'guest';
  }

  private migrateLegacyKeys(): void {
    try {
      // 舊版按過「暫時不用」會寫死 done，造成之後怎麼開都不出現。
      if (localStorage.getItem('dm-tour-guest') === 'done') {
        localStorage.removeItem('dm-tour-guest');
      }
      if (localStorage.getItem('dm-tour-agency') === 'done') {
        localStorage.removeItem('dm-tour-agency');
      }
    } catch {
      // ignore
    }
  }

  maybeOfferTour(): void {
    const role = this.auth.principal().role;
    if (role === 'donor' || role === 'admin') {
      this.abortForRole();
      return;
    }

    if (this.active() || this.promptOpen()) {
      if (!this.allowsTour(this.audience())) {
        this.abortForRole();
      }
      return;
    }

    if (role === 'guest' && !this.isDone('guest') && !this.isSkipped('guest') && this.isGuestSurface()) {
      this.audience.set('guest');
      this.promptOpen.set(true);
      return;
    }

    if (role === 'agency' && !this.isDone('agency') && !this.isSkipped('agency') && this.isAgencySurface()) {
      this.audience.set('agency');
      this.promptOpen.set(true);
    }
  }

  /** 登入導向完成後立刻叫出受助者導覽。 */
  offerAgencyAfterLogin(): void {
    if (!this.allowsTour('agency')) {
      this.abortForRole();
      return;
    }
    this.clearSkip('agency');
    if (this.isDone('agency')) {
      return;
    }
    this.audience.set('agency');
    this.promptOpen.set(true);
  }

  accept(): void {
    if (!this.allowsTour(this.audience())) {
      this.abortForRole();
      return;
    }
    this.promptOpen.set(false);
    this.stepIndex.set(0);
    this.active.set(true);
    void this.prepareCurrentStep();
  }

  decline(): void {
    this.promptOpen.set(false);
    this.clearHighlight();
    this.setSkipped(this.audience());
  }

  dismissPrompt(): void {
    this.decline();
  }

  async next(): Promise<void> {
    const steps = this.stepsFor(this.audience());
    if (this.stepIndex() >= steps.length - 1) {
      this.finish();
      return;
    }
    this.stepIndex.update((value) => value + 1);
    await this.prepareCurrentStep();
  }

  finish(): void {
    // 先清選單強制開啟，仍保持 active，header 才能把手機選單關上。
    this.clearHighlight();
    this.active.set(false);
    this.setDone(this.audience());
    this.clearSkip(this.audience());
  }

  skip(): void {
    this.finish();
  }

  /** 訪客／受助者可用 ?tour=1 重播；捐助者／管理者無效。 */
  replay(audience?: TourAudience): void {
    const role = this.auth.principal().role;
    if (role === 'donor' || role === 'admin') {
      this.abortForRole();
      return;
    }
    const next = audience ?? (role === 'agency' ? 'agency' : 'guest');
    if (!this.allowsTour(next)) {
      this.abortForRole();
      return;
    }
    this.clearDone(next);
    this.clearSkip(next);
    this.audience.set(next);
    this.promptOpen.set(true);
    this.clearHighlight();
    this.active.set(false);
    this.stepIndex.set(0);
  }

  private async prepareCurrentStep(): Promise<void> {
    if (!this.allowsTour(this.audience())) {
      this.abortForRole();
      return;
    }

    const step = this.currentStep();
    if (!step) {
      return;
    }

    if (step.route) {
      const current = this.router.url.split('?')[0];
      if (current !== step.route && !(step.route === '/home' && (current === '/' || current === '/home'))) {
        await this.router.navigateByUrl(step.route);
        await new Promise((resolve) => setTimeout(resolve, 280));
      }
    }

    const needNav = !!step.openNav;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    // 沒有 openNav 的步驟一定關上選單，避免卡在緊急物資區。
    this.forceMenuOpen.set(needNav && isMobile);
    this.forceDropdown.set(needNav ? this.dropdownKeyFor(step) : '');
    this.highlightSelector.set(step.anchor);

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  private dropdownKeyFor(step: TourStep): string {
    if (step.id === 'donate-area' || step.id === 'daily') {
      return 'guest-donate-area';
    }
    if (step.id === 'about-nav' || step.id === 'guide') {
      return 'guest-about-area';
    }
    if (step.id === 'faq' || step.id === 'ai') {
      return 'guest-service-area';
    }
    if (this.audience() === 'agency') {
      return 'agency-work-area';
    }
    return '';
  }

  private clearHighlight(): void {
    this.highlightSelector.set('');
    this.forceMenuOpen.set(false);
    this.forceDropdown.set('');
  }

  private stepsFor(audience: TourAudience): TourStep[] {
    return audience === 'agency' ? AGENCY_STEPS : GUEST_STEPS;
  }

  private isGuestSurface(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/home' || url.startsWith('/donor') || url === '/intro' || url.startsWith('/platform-guide');
  }

  private isAgencySurface(): boolean {
    return this.router.url.startsWith('/agency');
  }

  private handleTourQuery(): void {
    const params = new URLSearchParams(this.router.url.split('?')[1] ?? '');
    if (params.get('tour') === '1' || params.get('tour') === 'replay') {
      this.replay();
    }
  }

  private setDone(audience: TourAudience): void {
    try {
      localStorage.setItem(audience === 'agency' ? AGENCY_DONE_KEY : GUEST_DONE_KEY, '1');
    } catch {
      // ignore
    }
  }

  private clearDone(audience: TourAudience): void {
    try {
      localStorage.removeItem(audience === 'agency' ? AGENCY_DONE_KEY : GUEST_DONE_KEY);
    } catch {
      // ignore
    }
  }

  private isDone(audience: TourAudience): boolean {
    try {
      return localStorage.getItem(audience === 'agency' ? AGENCY_DONE_KEY : GUEST_DONE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private setSkipped(audience: TourAudience): void {
    try {
      sessionStorage.setItem(audience === 'agency' ? AGENCY_SKIP_SESSION : GUEST_SKIP_SESSION, '1');
    } catch {
      // ignore
    }
  }

  private clearSkip(audience: TourAudience): void {
    try {
      sessionStorage.removeItem(audience === 'agency' ? AGENCY_SKIP_SESSION : GUEST_SKIP_SESSION);
    } catch {
      // ignore
    }
  }

  private isSkipped(audience: TourAudience): boolean {
    try {
      return sessionStorage.getItem(audience === 'agency' ? AGENCY_SKIP_SESSION : GUEST_SKIP_SESSION) === '1';
    } catch {
      return false;
    }
  }
}
