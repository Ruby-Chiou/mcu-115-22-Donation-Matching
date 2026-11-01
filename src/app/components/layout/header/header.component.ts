import { Component, DestroyRef, HostListener, OnInit, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { navigationFor } from '../../../core/auth/navigation-catalog';
import { APP_ROLE_LABEL } from '../../../models/auth/app-role';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';
import { GuidedTourService } from '../../../core/services/guided-tour/guided-tour.service';
import { MemberMessageService } from '../../../core/services/member-center/member-message.service';
import { MemberMailDispatchService } from '../../../core/services/member-center/member-mail-dispatch.service';
import { MemberNotificationSettingsService } from '../../../core/services/member-center/member-notification-settings.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  protected readonly auth = inject(AuthSessionService);
  protected readonly messageService = inject(MemberMessageService);
  protected readonly tour = inject(GuidedTourService);
  private readonly notifications = inject(MemberNotificationSettingsService);
  private readonly mail = inject(MemberMailDispatchService);
  private readonly disaster = inject(DisasterControlService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isHeaderHidden = false;
  menuOpen = false;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.tour.isActive()) {
          this.menuOpen = false;
        }
      });

    effect(() => {
      // 導覽用 menuForcedOpen 控制選單顯示，不要寫進 menuOpen，否則導覽結束後選單會卡住。
      if (this.tour.isActive() && !this.tour.menuForcedOpen()) {
        this.menuOpen = false;
      }
      const role = this.auth.principal().role;
      if (role === 'donor' || role === 'admin') {
        this.menuOpen = false;
      }
    });
  }

  protected tourKey(name: string): string | null {
    if (name === '捐助專區') return 'guest-donate-area';
    if (name === '關於我們') return 'guest-about-area';
    if (name === '客服中心') return 'guest-service-area';
    if (name === '機構作業') return 'agency-work-area';
    if (name === '災害救助') return 'agency-disaster';
    return null;
  }

  protected subTourKey(link: string): string | null {
    if (link === '/donor/daily') return 'guest-daily';
    if (link === '/platform-guide') return 'guest-guide';
    if (link === '/customer-service/faq') return 'guest-faq';
    if (link === '/agency/disaster') return 'agency-disaster';
    return null;
  }

  protected isTourDropdownOpen(name: string): boolean {
    const key = this.tourKey(name);
    return !!key && this.tour.dropdownForced() === key;
  }

  ngOnInit(): void {
    void this.auth.restore().then(() => {
      if (!this.showInboxBell()) {
        return;
      }

      void this.notifications.loadSettings().catch(() => undefined);
      void this.messageService.loadInbox().catch(() => undefined);
      void this.mail.sweep();
    });
  }

  protected showInboxBell(): boolean {
    const role = this.auth.principal().role;
    return role === 'donor' || role === 'agency';
  }

  protected inboxLink(): string {
    return this.auth.principal().role === 'agency' ? '/agency/inbox' : '/member';
  }

  protected inboxQuery(): { tab: string } | null {
    return this.auth.principal().role === 'agency' ? null : { tab: 'inbox' };
  }

  get navItems() {
    return navigationFor(this.auth.principal().role, this.disaster.data().isOpen);
  }

  /** 每兩個字插入軟斷行，避免平板寬度只剩「三＋一」的彆扭換行。 */
  protected navLabel(name: string): string {
    return name.replace(/(.{2})(?=.)/gu, '$1\u200B');
  }

  protected homeLink(): string {
    return this.auth.principal().role === 'agency' ? '/agency/dashboard' : '/home';
  }

  protected accountLink(): string {
    return this.auth.principal().role === 'agency' ? '/agency/profile' : '/member';
  }

  protected accountLabel(): string {
    const role = this.auth.principal().role;
    if (role === 'agency') {
      return '機構資料';
    }
    if (role === 'admin') {
      return '客訴信箱';
    }
    return '會員專區';
  }

  protected get roleLabel(): string {
    const principal = this.auth.principal();
    if (principal.role === 'donor' && principal.donorKind === 'company') {
      return '公司捐助者';
    }

    return APP_ROLE_LABEL[principal.role];
  }

  protected logout(): void {
    this.menuOpen = false;
    void this.auth.signOut().then(() => this.router.navigateByUrl('/home'));
  }

  protected toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.isHeaderHidden = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.menuOpen) {
      this.isHeaderHidden = false;
      return;
    }

    this.isHeaderHidden = window.scrollY > 70;
  }
}
