import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { MemberMessageService } from '../../core/services/member-center/member-message.service';
import { AuthPrincipal } from '../../models/auth/app-role';
import { DonorHistoryComponent } from '../donor-history/donor-history.component';
import { MemberAcknowledgementsComponent } from './member-acknowledgements/member-acknowledgements.component';
import { MemberInboxComponent } from './member-inbox/member-inbox.component';
import { MemberNotificationSettingsComponent } from './member-notification-settings/member-notification-settings.component';
import { MemberProfileComponent } from './member-profile/member-profile.component';

export type MemberTab = 'profile' | 'inbox' | 'acknowledgements' | 'notifications' | 'history';

const MEMBER_TABS: MemberTab[] = ['profile', 'inbox', 'acknowledgements', 'notifications', 'history'];

@Component({
  selector: 'app-member-center',
  imports: [
    MemberProfileComponent,
    MemberInboxComponent,
    MemberAcknowledgementsComponent,
    MemberNotificationSettingsComponent,
    DonorHistoryComponent,
  ],
  templateUrl: './member-center.component.html',
  styleUrl: './member-center.component.scss',
})
export class MemberCenterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSessionService);
  protected readonly messageService = inject(MemberMessageService);

  readonly activeTab = signal<MemberTab>('profile');
  protected readonly companyNotice = computed(() => companyNoticeText(this.auth.principal()));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const raw = params.get('tab');
      const tab = (raw === 'certificates' ? 'acknowledgements' : raw) as MemberTab | null;

      if (tab && MEMBER_TABS.includes(tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  selectTab(tab: MemberTab): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }
}

function companyNoticeText(principal: AuthPrincipal): string {
  if (principal.donorKind !== 'company' || principal.companyStatus === 'approved') {
    return '';
  }

  const note = principal.companyReviewNote.trim();

  if (principal.companyStatus === 'rejected') {
    return note ? `企業身分未通過審核，目前不能送出捐助。原因：${note}` : '企業身分未通過審核，目前不能送出捐助。';
  }

  if (principal.companyStatus === 'supplement') {
    return note ? `企業身分需要補件後才能捐助。${note}` : '企業身分需要補件後才能捐助。';
  }

  return '企業身分審核中。管理者會依統一編號查公開公司登記，並打電話確認這份申請與代表人。通過前可以瀏覽平台，還不能送出捐助。';
}
