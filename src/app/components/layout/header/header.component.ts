import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { navigationFor } from '../../../core/auth/navigation-catalog';
import { APP_ROLE_LABEL } from '../../../models/auth/app-role';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';
import { MemberMessageService } from '../../../core/services/member-center/member-message.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  protected readonly auth = inject(AuthSessionService);
  protected readonly messageService = inject(MemberMessageService);
  private readonly disaster = inject(DisasterControlService);
  private readonly router = inject(Router);

    isHeaderHidden = false;

  ngOnInit(): void {
    void this.auth.restore().then(() => {
      if (this.auth.principal().role !== 'donor') {
        return;
      }

      this.messageService.loadInbox().catch(() => {
        // 未讀數載入失敗不影響導覽列
      });
    });
  }

  get navItems() {
    return navigationFor(this.auth.principal().role, this.disaster.data().isOpen);
  }

  protected homeLink(): string {
    return this.auth.principal().role === 'agency' ? '/agency/dashboard' : '/home';
  }

  protected accountLink(): string {
    return this.auth.principal().role === 'agency' ? '/agency/profile' : '/member';
  }

  protected accountLabel(): string {
    return this.auth.principal().role === 'agency' ? '機構資料' : '會員專區';
  }

  protected get roleLabel(): string {
    const principal = this.auth.principal();
    if (principal.role === 'donor' && principal.donorKind === 'company') {
      return '公司捐助者';
    }

    return APP_ROLE_LABEL[principal.role];
  }

  protected logout(): void {
    void this.auth.signOut().then(() => this.router.navigateByUrl('/home'));
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isHeaderHidden = window.scrollY > 70;
  }
}
