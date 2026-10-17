import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { MemberMessageService } from '../../core/services/member-center/member-message.service';
import { MemberAcknowledgementsComponent } from './member-acknowledgements/member-acknowledgements.component';
import { MemberInboxComponent } from './member-inbox/member-inbox.component';
import { MemberNotificationSettingsComponent } from './member-notification-settings/member-notification-settings.component';
import { MemberProfileComponent } from './member-profile/member-profile.component';

export type MemberTab = 'profile' | 'inbox' | 'acknowledgements' | 'notifications';

const MEMBER_TABS: MemberTab[] = ['profile', 'inbox', 'acknowledgements', 'notifications'];

@Component({
  selector: 'app-member-center',
  imports: [
    MemberProfileComponent,
    MemberInboxComponent,
    MemberAcknowledgementsComponent,
    MemberNotificationSettingsComponent,
  ],
  templateUrl: './member-center.component.html',
  styleUrl: './member-center.component.scss',
})
export class MemberCenterComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly messageService = inject(MemberMessageService);

  readonly activeTab = signal<MemberTab>('profile');

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
    this.activeTab.set(tab);
  }
}
