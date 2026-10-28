import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CompanyCertificateRegistry } from '../../../core/auth/company-certificate.registry';
import { oauthRedirectUrl } from '../../../core/auth/oauth-redirect-url';
import { registrationPasswordMessage, registrationPhoneMessage } from '../../../core/auth/registration-rules';
import { toLoginMessage } from '../../../core/auth/login-message';
import { AuthRedirectService } from '../../../core/services/auth/auth-redirect.service';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { PasswordResetService } from '../../../core/services/auth/password-reset.service';
import { SocialAuthService, SocialProvider } from '../../../core/services/auth/social-auth.service';
import { SupabaseService } from '../../../core/services/database/supabase.service';

@Component({
  selector: 'app-donor-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './donor-register.component.html',
  styleUrl: './donor-register.component.scss',
})
export class DonorRegisterComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly social = inject(SocialAuthService);
  private readonly certificates = inject(CompanyCertificateRegistry);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSessionService);
  private readonly redirect = inject(AuthRedirectService);
  private readonly passwordReset = inject(PasswordResetService);

  @Output() backToRoleSelection = new EventEmitter<void>();
  @ViewChild('donorFormRef') donorFormRef!: ElementRef;

  kind: 'individual' | 'company' = 'individual';
  submitMessage = '';
  isError = false;
  submitting = false;
  showPassword = false;
  showConfirmPassword = false;

  togglePassword(field: 'password' | 'confirm' = 'password'): void {
    if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
      return;
    }

    this.showPassword = !this.showPassword;
  }

  donorForm = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
    taxId: '',
    representative: '',
    address: '',
    documentName: '',
  };

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }

  setKind(kind: 'individual' | 'company'): void {
    this.kind = kind;
    this.isError = false;
    this.submitMessage = '';
  }

  onDocument(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.donorForm.documentName = file?.name ?? '';
  }

  async socialRegister(provider: SocialProvider): Promise<void> {
    if (this.kind === 'company' || this.submitting) {
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      await this.social.start(provider, null);
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error);
      this.submitting = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const missingField = this.checkAndHighlightEmptyFields();
    if (missingField) {
      this.isError = true;
      this.submitMessage = '請完整填寫所有必要欄位。';
      return;
    }

    if (this.donorForm.password !== this.donorForm.confirmPassword) {
      this.isError = true;
      this.submitMessage = '密碼與確認密碼不一致。';
      return;
    }

    const phoneMessage = registrationPhoneMessage(this.donorForm.phone);
    if (phoneMessage) {
      this.isError = true;
      this.submitMessage = phoneMessage;
      return;
    }

    const passwordMessage = registrationPasswordMessage(this.donorForm.password);
    if (passwordMessage) {
      this.isError = true;
      this.submitMessage = passwordMessage;
      return;
    }

    if (this.kind === 'company' && !/^\d{8}$/.test(this.donorForm.taxId.trim())) {
      this.isError = true;
      this.submitMessage = '統一編號需要 8 位數字。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    const email = this.donorForm.email.trim();
    const displayName = this.kind === 'company' ? this.donorForm.companyName.trim() : this.donorForm.fullName.trim() || this.donorForm.accountName.trim();

    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password: this.donorForm.password,
        options: {
          emailRedirectTo: oauthRedirectUrl(window.location.origin, document.querySelector('base')?.getAttribute('href')),
          data: {
            role: 'donor',
            donor_kind: this.kind,
            display_name: displayName,
            full_name: this.kind === 'company' ? this.donorForm.representative.trim() : this.donorForm.fullName.trim(),
            account_name: this.kind === 'company' ? this.donorForm.taxId.trim() : this.donorForm.accountName.trim(),
            phone: this.donorForm.phone.trim(),
            company_name: this.donorForm.companyName.trim(),
            tax_id: this.donorForm.taxId.trim(),
            representative: this.donorForm.representative.trim(),
            address: this.donorForm.address.trim(),
            document_name: this.donorForm.documentName,
          },
        },
      });

      if (error) {
        this.isError = true;
        if (/already registered/i.test(error.message)) {
          try {
            await this.passwordReset.requestResetEmail(email);
            this.submitMessage =
              '此信箱已經註冊。若曾用 Google 登入、現在要改用密碼，客服信箱已寄出設定密碼連結（請查收件匣與垃圾郵件）。';
          } catch {
            this.submitMessage = '此信箱已經註冊。請直接登入；若曾用 Google，請改按 Google 或到忘記密碼設定密碼。';
          }
          return;
        }

        this.submitMessage = toLoginMessage(error, email);
        return;
      }

      let hasSession = !!data.session;
      if (!hasSession) {
        try {
          await this.auth.signIn(email, this.donorForm.password, true);
          hasSession = this.auth.principal().role !== 'guest';
        } catch {
          hasSession = false;
        }
      }

      if (this.kind === 'company') {
        const card = this.certificates.issue({
          holderName: this.donorForm.representative,
          companyName: this.donorForm.companyName,
          taxId: this.donorForm.taxId,
          email,
          password: this.donorForm.password,
        });
        this.submitMessage = `公司註冊已送出。管理者會查公開公司登記並打電話確認。這台裝置的憑證是「${card.agencyName}／${card.holderName}」。即將進入會員專區…`;
        if (hasSession) {
          await this.redirect.navigateAfterNotice('/member?notice=company-review');
        }
        return;
      }

      if (hasSession) {
        this.submitMessage = '註冊成功，即將進入首頁…';
        await this.redirect.navigateAfterNotice('/home');
        return;
      }

      this.submitMessage = '註冊已送出。Gmail 或學校信箱都可直接用帳密密碼登入；若仍提示未啟用，請到收件匣（含垃圾郵件）點啟用連結後再登入。';
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error);
    } finally {
      this.submitting = false;
    }
  }

  private checkAndHighlightEmptyFields(): HTMLElement | null {
    const formElement = this.donorFormRef?.nativeElement;
    if (!formElement) return null;

    const previousErrors = formElement.querySelectorAll('.input-error, .shake');
    previousErrors.forEach((el: Element) => el.classList.remove('input-error', 'shake'));

    let firstInvalidElement: HTMLElement | null = null;
    const checks =
      this.kind === 'company'
        ? [
            { val: this.donorForm.email, name: 'donorEmail' },
            { val: this.donorForm.companyName, name: 'companyName' },
            { val: this.donorForm.taxId, name: 'taxId' },
            { val: this.donorForm.representative, name: 'representative' },
            { val: this.donorForm.phone, name: 'phone' },
            { val: this.donorForm.address, name: 'address' },
            { val: this.donorForm.documentName, name: 'companyDocument' },
            { val: this.donorForm.password, name: 'donorPassword' },
            { val: this.donorForm.confirmPassword, name: 'donorConfirmPassword' },
          ]
        : [
            { val: this.donorForm.email, name: 'donorEmail' },
            { val: this.donorForm.accountName, name: 'donorAccountName' },
            { val: this.donorForm.fullName, name: 'fullName' },
            { val: this.donorForm.phone, name: 'phone' },
            { val: this.donorForm.password, name: 'donorPassword' },
            { val: this.donorForm.confirmPassword, name: 'donorConfirmPassword' },
          ];

    for (const item of checks) {
      if (!item.val) {
        const el = formElement.querySelector(`[name="${item.name}"]`) as HTMLElement;
        if (el && !firstInvalidElement) firstInvalidElement = el;
      }
    }

    if (firstInvalidElement) {
      firstInvalidElement.classList.add('input-error', 'shake');
      firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidElement.focus();
      setTimeout(() => firstInvalidElement?.classList.remove('shake'), 400);
    }

    return firstInvalidElement;
  }
}
