import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { MemberMessageService } from '../../core/services/member-center/member-message.service';
import { MemberCertificatesComponent } from './member-certificates/member-certificates.component';
import { MemberInboxComponent } from './member-inbox/member-inbox.component';
import { MemberProfileComponent } from './member-profile/member-profile.component';

export type MemberTab = 'profile' | 'inbox' | 'certificates';

const MEMBER_TABS: MemberTab[] = ['profile', 'inbox', 'certificates'];

@Component({
  selector: 'app-member-center',
  imports: [MemberProfileComponent, MemberInboxComponent, MemberCertificatesComponent],
  templateUrl: './member-center.component.html',
  styleUrl: './member-center.component.scss',
})
export class MemberCenterComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly messageService = inject(MemberMessageService);

  readonly activeTab = signal<MemberTab>('profile');

  constructor() {
    // header 的鈴鐺會帶 ?tab=inbox 進來
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const tab = params.get('tab') as MemberTab | null;

      if (tab && MEMBER_TABS.includes(tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  selectTab(tab: MemberTab): void {
    this.activeTab.set(tab);
  }
}
