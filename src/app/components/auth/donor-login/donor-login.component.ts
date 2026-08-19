import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-donor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './donor-login.component.html',
  styleUrl: './donor-login.component.scss',
})
export class DonorLoginComponent {
  @Output() backToRoleSelection = new EventEmitter<void>();
  @Output() forgotPasswordClicked = new EventEmitter<void>();

  submitMessage = '';
  rememberMe = false;

  loginForm = {
    email: '',
    password: '',
  };

  socialRegister(provider: 'google' | 'line' | 'facebook'): void {
    // TODO: 開啟 OAuth 流程或呼叫後端 endpoint；暫時顯示提示
    this.submitMessage = `啟動 ${provider} 註冊（示意）`;
  }

  onSubmit(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.submitMessage = '請輸入電子信箱與密碼。';
      return;
    }
    // TODO: 呼叫捐助者登入 API
    this.submitMessage = '捐助者登入成功（示意）';
  }

  onForgotPassword(): void {
    this.forgotPasswordClicked.emit();
  }

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }
}
