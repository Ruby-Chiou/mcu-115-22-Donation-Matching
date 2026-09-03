import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-donor-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './donor-register.component.html',
  styleUrl: './donor-register.component.scss',
})
export class DonorRegisterComponent {
  @Output() backToRoleSelection = new EventEmitter<void>();
  @ViewChild('donorFormRef') donorFormRef!: ElementRef;

  submitMessage = '';

  donorForm = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  };

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }

  socialRegister(provider: 'google' | 'line' | 'facebook'): void {
    this.submitMessage = `啟動 ${provider} 註冊（示意）`;
  }

  onSubmit(): void {
    const missingField = this.checkAndHighlightEmptyFields();
    if (missingField) {
      this.submitMessage = '請完整填寫所有必要欄位。';
      return;
    }

    if (this.donorForm.password !== this.donorForm.confirmPassword) {
      this.submitMessage = '密碼與確認密碼不一致。';
      return;
    }

    this.submitMessage = '捐助者註冊送出成功（示意）';
  }

  private checkAndHighlightEmptyFields(): HTMLElement | null {
    const formElement = this.donorFormRef?.nativeElement;
    if (!formElement) return null;

    const previousErrors = formElement.querySelectorAll('.input-error, .shake');
    previousErrors.forEach((el: Element) => el.classList.remove('input-error', 'shake'));

    let firstInvalidElement: HTMLElement | null = null;
    const checks = [
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
