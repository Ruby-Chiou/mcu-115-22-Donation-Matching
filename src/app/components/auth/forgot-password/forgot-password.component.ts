import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { toLoginMessage } from '../../../core/auth/login-message';
import { PasswordResetService } from '../../../core/services/auth/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly passwordReset = inject(PasswordResetService);

  @Output() backToLoginClicked = new EventEmitter<void>();

  submitMessage = '';
  isError = false;
  submitting = false;

  forgotPasswordForm = {
    email: '',
  };

  async onSubmit(): Promise<void> {
    const email = this.forgotPasswordForm.email.trim();
    if (!email) {
      this.isError = true;
      this.submitMessage = '請輸入您的電子信箱。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      this.submitMessage = await this.passwordReset.requestResetEmail(email);
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error, email);
    } finally {
      this.submitting = false;
    }
  }

  backToLogin(): void {
    this.backToLoginClicked.emit();
  }
}
