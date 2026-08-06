import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';

type UserRole = 'donor' | 'recipient';
type LoginStep = 'login' | 'profile';

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
  rememberMe = false;
  submitMessage = '';
  loginStep: LoginStep = 'login';

  loginForm = {
    email: '',
    accountName: '',
    password: '',
  };

  otpDigits = ['', '', '', '', '', ''];

  profileForm = {
    agencyName: '',
    registrationNumber: '',
    representative: '',
    contactPhone: '',
    defaultAddress: '',
    newPassword: '',
    confirmPassword: '',
    needDescription: '',
  };
  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.showRoleModal = false;
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.submitMessage = '';
    this.loginStep = 'login';
  }

  backToLoginStep(): void {
    this.loginStep = 'login';
    this.submitMessage = '';
  }

  onSubmit(): void {
    if (!this.selectedRole) {
      this.submitMessage = '請先選擇角色';
      return;
    }

    if (this.selectedRole === 'recipient' && this.loginStep === 'login') {
      this.submitMessage = '驗證成功，請完成首次資料設定。';
      this.loginStep = 'profile';
      return;
    }

    if (this.selectedRole === 'donor') {
      this.submitMessage = '捐助者登入成功';
      return;
    }

    if (this.profileForm.newPassword !== this.profileForm.confirmPassword) {
      this.submitMessage = '新密碼與確認密碼不一致';
      return;
    }

    this.submitMessage = '受助者資料已完成設定。';
  }

  get isRecipient(): boolean {
    return this.selectedRole === 'recipient';
  }

  get isProfileStep(): boolean {
    return this.selectedRole === 'recipient' && this.loginStep === 'profile';
  }

  get roleHeading(): string {
    return this.selectedRole === 'recipient' ? '受助者登入' : '捐助者登入';
  }

  get roleDescription(): string {
    return this.selectedRole === 'recipient' ? '請輸入信箱、帳號名稱與密碼；驗證碼由兩種身份共用。' : '歡迎回來，請輸入信箱與密碼。';
  }
}
