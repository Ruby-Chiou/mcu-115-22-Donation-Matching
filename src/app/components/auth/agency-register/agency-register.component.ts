import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agency-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-register.component.html',
  styleUrl: './agency-register.component.scss',
})
export class AgencyRegisterComponent {
  @Output() backToRoleSelection = new EventEmitter<void>();
  @ViewChild('agencyFormRef') agencyFormRef!: ElementRef;

  submitMessage = '';

  agencyForm = {
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    registrationNumber: '',
    representative: '',
    contactPhone: '',
    defaultAddress: '',
    contactPersonName: '',
    contactPersonTitle: '',
    department: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    verificationDocumentUrl: '',
    verificationStatus: 'pending',
    consentToContact: false,
    agreeToTerms: false,
  };

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }

  onVerificationFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.agencyForm.verificationDocumentUrl = file.name;
    this.submitMessage = '已選取驗證文件（示意）';
  }

  onSubmit(): void {
    const missingField = this.checkAndHighlightEmptyFields();
    if (missingField) {
      this.submitMessage = '請完整填寫所有必要欄位並勾選同意事項。';
      return;
    }

    if (this.agencyForm.password !== this.agencyForm.confirmPassword) {
      this.submitMessage = '密碼與確認密碼不一致。';
      return;
    }

    this.submitMessage = '受助機構註冊送出成功（示意）';
  }

  private checkAndHighlightEmptyFields(): HTMLElement | null {
    const formElement = this.agencyFormRef?.nativeElement;
    if (!formElement) return null;

    const previousErrors = formElement.querySelectorAll('.input-error, .shake');
    previousErrors.forEach((el: Element) => el.classList.remove('input-error', 'shake'));

    let firstInvalidElement: HTMLElement | null = null;
    const checks = [
      { val: this.agencyForm.email, name: 'agencyEmail' },
      { val: this.agencyForm.agencyName, name: 'agencyAgencyName' },
      { val: this.agencyForm.registrationNumber, name: 'agencyRegistrationNumber' },
      { val: this.agencyForm.representative, name: 'agencyRepresentative' },
      { val: this.agencyForm.contactPhone, name: 'agencyContactPhone' },
      { val: this.agencyForm.defaultAddress, name: 'agencyDefaultAddress' },
      { val: this.agencyForm.contactPersonName, name: 'contactPersonName' },
      { val: this.agencyForm.contactPersonTitle, name: 'contactPersonTitle' },
      { val: this.agencyForm.department, name: 'department' },
      { val: this.agencyForm.contactPersonPhone, name: 'contactPersonPhone' },
      { val: this.agencyForm.contactPersonEmail, name: 'contactPersonEmail' },
      { val: this.agencyForm.verificationDocumentUrl, name: 'verificationFileInput' },
      { val: this.agencyForm.password, name: 'agencyPassword' },
      { val: this.agencyForm.confirmPassword, name: 'agencyConfirmPassword' },
      { val: this.agencyForm.consentToContact, name: 'consentToContact' },
      { val: this.agencyForm.agreeToTerms, name: 'agreeToTerms' },
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
