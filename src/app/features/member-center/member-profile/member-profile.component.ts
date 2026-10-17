import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { AVATAR_ACCEPT_TYPES, MemberProfileService } from '../../../core/services/member-center/member-profile.service';
import { DONOR_LOGIN_PROVIDER_LABELS } from '../../../models/user/donor';

const TW_MOBILE_PATTERN = /^09\d{8}$/;
const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9_\u4e00-\u9fff]{2,20}$/;

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return newPassword && confirmPassword && newPassword !== confirmPassword ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-member-profile',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './member-profile.component.html',
  styleUrl: './member-profile.component.scss',
})
export class MemberProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly profileService = inject(MemberProfileService);

  readonly avatarAccept = AVATAR_ACCEPT_TYPES.join(',');
  readonly providerLabels = DONOR_LOGIN_PROVIDER_LABELS;

  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly isChangingPassword = signal(false);
  readonly showPasswordForm = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly isDeleting = signal(false);
  readonly deleteConfirmText = signal('');
  readonly notice = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(20)]],
    accountName: ['', [Validators.pattern(ACCOUNT_NAME_PATTERN)]],
    fullName: ['', [Validators.maxLength(40)]],
    phoneNumber: ['', [Validators.pattern(TW_MOBILE_PATTERN)]],
    city: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  async ngOnInit(): Promise<void> {
    try {
      await this.profileService.loadProfile();
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : '無法載入會員資料，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEdit(): void {
    const profile = this.profileService.profile();

    if (!profile) {
      return;
    }

    this.profileForm.reset({
      displayName: profile.displayName,
      accountName: profile.accountName ?? '',
      fullName: profile.fullName ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      city: profile.city ?? '',
    });
    this.notice.set(null);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    try {
      await this.profileService.updateProfile(this.profileForm.getRawValue());
      this.isEditing.set(false);
      this.notice.set({ type: 'success', text: '個人資料已更新' });
    } catch {
      this.notice.set({ type: 'error', text: '儲存失敗，請稍後再試' });
    } finally {
      this.isSaving.set(false);
    }
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.isUploading.set(true);

    try {
      await this.profileService.uploadAvatar(file);
      this.notice.set({ type: 'success', text: '大頭貼已更新' });
    } catch (error) {
      this.notice.set({ type: 'error', text: error instanceof Error ? error.message : '大頭貼上傳失敗' });
    } finally {
      this.isUploading.set(false);
    }
  }

  togglePasswordForm(): void {
    this.passwordForm.reset();
    this.showPasswordForm.update((value) => !value);
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.isChangingPassword.set(true);

    try {
      await this.profileService.changePassword(currentPassword, newPassword);
      this.showPasswordForm.set(false);
      this.passwordForm.reset();
      this.notice.set({ type: 'success', text: '密碼已修改' });
    } catch (error) {
      this.notice.set({ type: 'error', text: error instanceof Error ? error.message : '密碼修改失敗' });
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  openDeleteConfirm(): void {
    this.deleteConfirmText.set('');
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deleteConfirmText.set('');
  }

  onDeleteConfirmInput(event: Event): void {
    this.deleteConfirmText.set((event.target as HTMLInputElement).value);
  }

  canConfirmDelete(): boolean {
    return this.deleteConfirmText().trim() === '確認註銷';
  }

  async confirmDeleteAccount(): Promise<void> {
    if (!this.canConfirmDelete()) {
      return;
    }

    this.isDeleting.set(true);

    try {
      await this.profileService.deleteAccount();
      window.alert('帳號已註銷。感謝您曾使用本平台。');
    } catch {
      this.notice.set({ type: 'error', text: '註銷失敗，請稍後再試' });
      this.showDeleteConfirm.set(false);
    } finally {
      this.isDeleting.set(false);
    }
  }

  hasError(
    controlName: 'displayName' | 'accountName' | 'fullName' | 'phoneNumber' | 'city',
    errorCode: string
  ): boolean {
    const control = this.profileForm.controls[controlName];

    return control.touched && control.hasError(errorCode);
  }

  hasPasswordError(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword', errorCode: string): boolean {
    const control = this.passwordForm.controls[controlName];

    return control.touched && control.hasError(errorCode);
  }
}
