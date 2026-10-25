import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { AgencyAccessGrant, AgencyAccessService } from '../../core/services/agency/agency-access.service';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-agency-access-banner',
  imports: [DatePipe],
  templateUrl: './agency-access-banner.component.html',
  styleUrl: './agency-access-banner.component.scss',
})
export class AgencyAccessBannerComponent implements OnInit, OnDestroy {
  private readonly access = inject(AgencyAccessService);
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly incoming = this.access.incoming;

  protected authRole(): string {
    return this.auth.principal().role;
  }
  protected readonly acting = signal<AgencyAccessGrant | null>(null);
  protected readonly notice = signal('');
  protected readonly busy = signal(false);
  protected onAgencyPage = false;
  private timer = 0;
  private leaving = false;
  private readonly refresh = (): void => {
    if (!document.hidden) {
      void this.load();
    }
  };

  async ngOnInit(): Promise<void> {
    this.onAgencyPage = this.router.url.startsWith('/agency');
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.onAgencyPage = this.router.url.startsWith('/agency');
      void this.load();
    });
    this.timer = window.setInterval(this.refresh, 2000);
    window.addEventListener('focus', this.refresh);
    await this.load();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
    window.removeEventListener('focus', this.refresh);
  }

  protected async decide(id: number, accept: boolean): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.notice.set('');
    try {
      await this.access.decide(id, accept);
      this.notice.set(accept ? '已同意，管理者可以在兩小時內協助處理。' : '已拒絕這次申請。');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : '沒有完成。');
    } finally {
      this.busy.set(false);
    }
  }

  protected async revoke(id: number): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.notice.set('');
    try {
      const adminLeaving = this.auth.principal().role === 'admin' && this.onAgencyPage;
      await this.access.revoke(id);
      this.acting.set(null);
      if (adminLeaving) {
        this.leaving = true;
        this.access.noteLeave('已結束這次接入。');
        await this.router.navigateByUrl('/admin/dashboard');
        return;
      }
      await this.load();
      this.notice.set('已結束這次接入。');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : '沒有結束。');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    await this.auth.restore();
    const role = this.auth.principal().role;
    if (role === 'agency') {
      await this.access.incomingForAgency().catch(() => undefined);
      return;
    }

    if (role === 'admin' && this.onAgencyPage) {
      if (this.leaving) {
        return;
      }
      try {
        const grant = await this.access.activeGrant(true);
        const open = !!grant && this.access.stillOpen(grant);
        this.acting.set(open ? grant : null);
        if (open) {
          return;
        }
        this.leaving = true;
        this.access.noteLeave('受助者已結束接入，已回到總覽。');
        await this.router.navigateByUrl('/admin/dashboard');
      } catch {
        return;
      }
      return;
    }

    this.leaving = false;
  }
}
