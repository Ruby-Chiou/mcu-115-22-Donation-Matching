import { Component, signal } from '@angular/core';

import { MemberInboxComponent } from '../../member-center/member-inbox/member-inbox.component';
import { MemberNotificationSettingsComponent } from '../../member-center/member-notification-settings/member-notification-settings.component';

@Component({
  selector: 'app-agency-inbox',
  imports: [MemberInboxComponent, MemberNotificationSettingsComponent],
  templateUrl: './agency-inbox.component.html',
  styleUrl: './agency-inbox.component.scss',
})
export class AgencyInboxComponent {
  protected readonly tab = signal<'inbox' | 'settings'>('inbox');
}
