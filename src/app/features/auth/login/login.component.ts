import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';
import { DonorLoginComponent } from '../../../components/auth/donor-login/donor-login.component';
import { AgencyLoginComponent } from '../../../components/auth/agency-login/agency-login.component';
import { ForgotPasswordComponent } from '../../../components/auth/forgot-password/forgot-password.component';
import { registrationPasswordMessage } from '../../../core/auth/registration-rules';
import { toLoginMessage } from '../../../core/auth/login-message';
import { RoleAccessPolicy } from '../../../core/auth/role-access.policy';
import { AuthRedirectService } from '../../../core/services/auth/auth-redirect.service';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { PasswordResetService } from '../../../core/services/auth/password-reset.service';
import { LoginPortal } from '../../../models/auth/app-role';

type UserRole = LoginPortal;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleSelectorComponent, DonorLoginComponent, AgencyLoginComponent, ForgotPasswordComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthSessionService);
  private readonly redirect = inject(AuthRedirectService);
  private readonly policy = inject(RoleAccessPolicy);
  private readonly passwordReset = inject(PasswordResetService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  selectedRole: UserRole | null = null;
  showRoleModal = true;
  isForgotPasswordStep = false;
  showRecoveryPassword = false;
  resetToken = '';
  recoveryPassword = '';
  recoveryConfirm = '';
  recoveryMessage = '';
  recoveryError = false;
  recoverySubmitting = false;
  showRecoveryPasswordVisible = false;

  async ngOnInit(): Promise<void> {
    await this.auth.restore();
    this.openResetFromQuery();
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.showRoleModal = false;
    this.isForgotPasswordStep = false;
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.isForgotPasswordStep = false;
  }

  goToForgotPassword(): void {
    this.isForgotPasswordStep = true;
  }

  backToLogin(): void {
    this.isForgotPasswordStep = false;
  }

  openRecovery(): void {
    this.showRecoveryPassword = true;
    this.showRoleModal = false;
    this.isForgotPasswordStep = false;
  }

  toggleRecoveryPassword(): void {
    this.showRecoveryPasswordVisible = !this.showRecoveryPasswordVisible;
  }

  async saveRecoveryPassword(): Promise<void> {
    const passwordMessage = registrationPasswordMessage(this.recoveryPassword);
    if (passwordMessage) {
      this.recoveryError = true;
      this.recoveryMessage = passwordMessage;
      return;
    }

    if (this.recoveryPassword !== this.recoveryConfirm) {
      this.recoveryError = true;
      this.recoveryMessage = '兩次輸入的密碼不一致。';
      return;
    }

    if (!this.resetToken) {
      this.recoveryError = true;
      this.recoveryMessage = '重設連結無效或已過期，請重新申請忘記密碼。';
      return;
    }

    this.recoverySubmitting = true;
    this.recoveryError = false;
    this.recoveryMessage = '正在儲存新密碼…';

    try {
      const result = await this.passwordReset.confirmNewPassword(this.resetToken, this.recoveryPassword);
      this.recoveryMessage = `${result.message}即將為你登入…`;
      await this.auth.signIn(result.email, this.recoveryPassword, true);
      this.resetToken = '';
      this.showRecoveryPassword = false;
      await this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      const home = this.policy.home(this.auth.principal().role);
      await this.redirect.navigateAfterNotice(home);
    } catch (error) {
      this.recoveryError = true;
      this.recoveryMessage = toLoginMessage(error) || '新密碼沒有存下，請稍後再試。';
      this.recoverySubmitting = false;
    }
  }

  get isAgency(): boolean {
    return this.selectedRole === 'agency';
  }

  private openResetFromQuery(): void {
    const params = this.route.snapshot.queryParamMap;
    const isReset = params.get('reset') === '1';
    // 新信用 token；相容舊信 token_hash（會提示重新申請）
    const token = (params.get('token') ?? '').trim();
    const legacyHash = (params.get('token_hash') ?? '').trim();

    if (!isReset) {
      return;
    }

    if (!token && legacyHash) {
      this.showRoleModal = true;
      this.showRecoveryPassword = false;
      this.isForgotPasswordStep = true;
      return;
    }

    if (!token) {
      return;
    }

    this.resetToken = token;
    this.recoveryMessage = '請設定新密碼。完成後即可用帳密密碼登入。';
    this.recoveryError = false;
    this.openRecovery();
  }
}
