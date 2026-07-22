import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgencyProfile } from '../../../models/user/agency';

type UserRole = 'donor' | 'recipient';
type LoginStep = 'login' | 'profile';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
    this.submitMessage = '';
    this.loginStep = 'login';
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.loginStep = 'login';
    this.submitMessage = '';
  }

  backToLoginStep(): void {
    this.loginStep = 'login';
    this.submitMessage = '';
  }

  buildAgencyPayload(): Partial<AgencyProfile> {
    return {
      role: 'AGENCY',
      email: this.loginForm.email,
      agencyName: this.profileForm.agencyName,
      registrationNumber: this.profileForm.registrationNumber,
      representative: this.profileForm.representative,
      contactPhone: this.profileForm.contactPhone,
      defaultAddress: this.profileForm.defaultAddress,
      isVerified: 'PENDING',
    };
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

    const payload = this.buildAgencyPayload();
    console.log('受助者首次資料設定 payload:', payload);

    this.submitMessage = '受助者資料已完成設定，之後可使用帳密登入。';
  }

  get isRecipient(): boolean {
    return this.selectedRole === 'recipient';
  }

  get isProfileStep(): boolean {
    return this.selectedRole === 'recipient' && this.loginStep === 'profile';
  }

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  get roleHeading(): string {
    return this.selectedRole === 'recipient' ? '受助者登入' : '捐助者登入';
  }

  get roleDescription(): string {
    return this.selectedRole === 'recipient' ? '初次註冊時，需輸入臨時帳密登入成功後，再完成註冊資料。' : '歡迎回來，請輸入信箱與密碼。';
  }
}
