import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  @Output() backToLoginClicked = new EventEmitter<void>();

  submitMessage = '';

  forgotPasswordForm = {
    email: '',
  };

  onSubmit(): void {
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

  backToLogin(): void {
    this.backToLoginClicked.emit();
  }
}
