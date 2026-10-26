import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { MemberNotificationSettingsService } from '../../../core/services/member-center/member-notification-settings.service';
import { MemberProfileService } from '../../../core/services/member-center/member-profile.service';
import {
  EMAIL_DIGEST_MODE_LABELS,
  EmailDigestMode,
} from '../../../models/member/notification-settings';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

@Component({
  selector: 'app-member-notification-settings',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './member-notification-settings.component.html',
  styleUrl: './member-notification-settings.component.scss',
})
export class MemberNotificationSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly settingsService = inject(MemberNotificationSettingsService);
  protected readonly profileService = inject(MemberProfileService);
  private readonly auth = inject(AuthSessionService);

  readonly digestLabels = EMAIL_DIGEST_MODE_LABELS;
  readonly digestModes = Object.keys(EMAIL_DIGEST_MODE_LABELS) as EmailDigestMode[];

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorText = signal('');
  readonly notice = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    inAppSystem: [true],
    inAppAgency: [true],
    inAppDonation: [true],
    emailEnabled: [false],
    emailSystem: [false],
    emailAgency: [true],
    emailDonation: [true],
    emailDigestMode: this.fb.nonNullable.control<EmailDigestMode>('DAILY'),
    quietHoursEnabled: [true],
    quietHoursStart: ['22:00', [Validators.required, Validators.pattern(TIME_PATTERN)]],
    quietHoursEnd: ['08:00', [Validators.required, Validators.pattern(TIME_PATTERN)]],
  });

  protected noticeEmail(): string {
    return this.auth.principal().email || this.profileService.profile()?.email || '';
  }

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.settingsService.loadSettings(), this.profileService.loadProfile().catch(() => null)]);
      const settings = this.settingsService.settings();

      if (settings) {
        this.form.reset({
          inAppSystem: settings.inApp.system,
          inAppAgency: settings.inApp.agency,
          inAppDonation: settings.inApp.donation,
          emailEnabled: settings.emailEnabled,
          emailSystem: settings.email.system,
          emailAgency: settings.email.agency,
          emailDonation: settings.email.donation,
          emailDigestMode: settings.emailDigestMode,
          quietHoursEnabled: settings.quietHoursEnabled,
          quietHoursStart: settings.quietHoursStart,
          quietHoursEnd: settings.quietHoursEnd,
        });
      }
    } catch {
      this.errorText.set('無法載入通知設定，請先在 Supabase 執行 member-notification-settings.sql。');
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving.set(true);
    this.notice.set(null);

    try {
      await this.settingsService.saveSettings({
        inApp: {
          system: raw.inAppSystem,
          agency: raw.inAppAgency,
          donation: raw.inAppDonation,
        },
        emailEnabled: raw.emailEnabled,
        email: {
          system: raw.emailSystem,
          agency: raw.emailAgency,
          donation: raw.emailDonation,
        },
        emailDigestMode: raw.emailDigestMode,
        quietHoursEnabled: raw.quietHoursEnabled,
        quietHoursStart: raw.quietHoursStart,
        quietHoursEnd: raw.quietHoursEnd,
      });
      this.notice.set({ type: 'success', text: '通知設定已儲存' });
    } catch {
      this.notice.set({ type: 'error', text: '儲存失敗，請稍後再試' });
    } finally {
      this.isSaving.set(false);
    }
  }
}
