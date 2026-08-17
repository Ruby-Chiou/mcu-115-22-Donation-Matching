import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';

type UserRole = 'donor' | 'recipient';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RoleSelectorComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  selectedRole: UserRole | null = null;
  showRoleModal = true;
  isForgotPasswordStep = false;
  submitMessage = '';
  rememberMe = false;

  loginForm = {
    email: '',
    password: '',
    credentialPin: '',
  };

  forgotPasswordForm = {
    email: '',
  };

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.showRoleModal = false;
    this.isForgotPasswordStep = false;
    this.submitMessage = '';
    this.resetForms();
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.isForgotPasswordStep = false;
    this.submitMessage = '';
    this.resetForms();
  }

  goToForgotPassword(): void {
    this.isForgotPasswordStep = true;
    this.submitMessage = '';
    this.forgotPasswordForm.email = '';
  }

  backToLogin(): void {
    this.isForgotPasswordStep = false;
    this.submitMessage = '';
  }

  onSubmit(): void {
    if (!this.selectedRole) {
      this.submitMessage = '請先選擇登入身分。';
      return;
    }

    // 捐助者登入
    if (this.selectedRole === 'donor') {
      if (!this.loginForm.email || !this.loginForm.password) {
        this.submitMessage = '請輸入電子信箱與密碼。';
        return;
      }
      // TODO: 呼叫捐助者登入 API
      this.submitMessage = '捐助者登入成功（示意）';
      return;
    }

    // 受助者（憑證PIN碼驗證）登入
    if (this.selectedRole === 'recipient') {
      if (!this.loginForm.credentialPin) {
        this.submitMessage = '請輸入憑證PIN碼。';
        return;
      }
      // TODO: 呼叫憑證PIN碼驗證 API
      this.submitMessage = '憑證驗證登入成功（示意）';
      return;
    }
  }

  onSubmitForgotPassword(): void {
    if (!this.forgotPasswordForm.email) {
      this.submitMessage = '請輸入您的電子信箱。';
      return;
    }

    // TODO: 呼叫忘記密碼 API，寄送重設連結
    this.submitMessage = '重設連結已寄送至您的電子信箱（示意）';
    setTimeout(() => {
      this.backToLogin();
    }, 2000);
  }

  private resetForms(): void {
    this.loginForm = {
      email: '',
      password: '',
      credentialPin: '',
    };
    this.forgotPasswordForm = {
      email: '',
    };
    this.rememberMe = false;
  }

  get roleHeading(): string {
    return this.isRecipient ? '受助者登入' : '捐助者登入';
  }

  get roleDescription(): string {
    if (this.isRecipient) {
      return '請輸入您的憑證PIN碼進行驗證。';
    }
    return '歡迎登入，請輸入帳號與密碼。';
  }

  get isRecipient(): boolean {
    return this.selectedRole === 'recipient';
  }
}
