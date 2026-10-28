import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CompanyCertificateRegistry } from '../../../core/auth/company-certificate.registry';
import { toLoginMessage } from '../../../core/auth/login-message';
import { AuthRedirectService } from '../../../core/services/auth/auth-redirect.service';
import { SocialAuthService, SocialProvider } from '../../../core/services/auth/social-auth.service';
import { NaturalPersonGateComponent } from '../natural-person-gate/natural-person-gate.component';

@Component({
  selector: 'app-donor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NaturalPersonGateComponent],
  templateUrl: './donor-login.component.html',
  styleUrl: './donor-login.component.scss',
})
export class DonorLoginComponent {
  private readonly redirect = inject(AuthRedirectService);
  private readonly social = inject(SocialAuthService);
  private readonly certificates = inject(CompanyCertificateRegistry);
  private readonly route = inject(ActivatedRoute);

  kind: 'individual' | 'company' = 'individual';
  gateOpen = false;

  @Input() heading = '捐助者登入';
  @Input() lead = '歡迎登入，請輸入帳號與密碼。';
  @Input() showSocial = true;

  @Output() backToRoleSelection = new EventEmitter<void>();
  @Output() forgotPasswordClicked = new EventEmitter<void>();

  submitMessage = '';
  isError = false;
  submitting = false;
  rememberMe = false;
  showPassword = false;

  loginForm = {
    email: '',
    password: '',
  };

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected certificateCards() {
    return this.certificates.list();
  }

  setKind(kind: 'individual' | 'company'): void {
    this.kind = kind;
    this.gateOpen = false;
    this.isError = false;
    this.submitMessage = '';
  }

  openCertificate(): void {
    this.gateOpen = true;
    this.isError = false;
    this.submitMessage = '';
  }

  closeCertificate(): void {
    this.gateOpen = false;
  }

  async onCertificateVerified(certificateId: string): Promise<void> {
    const login = this.certificates.findLogin(certificateId);
    if (!login) {
      this.gateOpen = false;
      this.isError = true;
      this.submitMessage = '這台裝置找不到這張企業憑證。請改用帳號密碼。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      this.submitMessage = '憑證驗證成功，即將進入頁面…';
      await this.redirect.signIn(login.email, login.password, false, this.route.snapshot.queryParamMap.get('returnUrl'));
    } catch (error) {
      this.gateOpen = false;
      this.isError = true;
      this.submitMessage = toLoginMessage(error, login.email);
      this.submitting = false;
    }
  }

  async socialRegister(provider: SocialProvider): Promise<void> {
    if (this.kind === 'company' || this.submitting) {
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      await this.social.start(provider, this.route.snapshot.queryParamMap.get('returnUrl'));
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

    if (!this.loginForm.email || !this.loginForm.password) {
      this.isError = true;
      this.submitMessage = '請輸入電子信箱與密碼。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      this.submitMessage = '登入成功，即將進入頁面…';
      await this.redirect.signIn(
        this.loginForm.email,
        this.loginForm.password,
        this.rememberMe,
        this.route.snapshot.queryParamMap.get('returnUrl'),
      );
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error, this.loginForm.email);
      this.submitting = false;
    }
  }

  onForgotPassword(): void {
    this.forgotPasswordClicked.emit();
  }

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }
}
