import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';

type UserRole = 'donor' | 'recipient';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RoleSelectorComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  selectedRole: UserRole | null = null;
  showRoleModal = true;
  submitMessage = '';

  donorForm = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  };

  recipientForm: any = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    registrationNumber: '',
    representative: '',
    contactPhone: '',
    defaultAddress: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    consentToContact: false,
    verificationDocumentUrl: '',
  };

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.showRoleModal = false;
    this.submitMessage = '';
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.submitMessage = '';
  }

  socialRegister(provider: 'google' | 'line' | 'facebook'): void {
    // TODO: 開啟 OAuth 流程或呼叫後端 endpoint；暫時顯示提示
    this.submitMessage = `啟動 ${provider} 註冊（示意）`;
  }

  onVerificationFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    // TODO: 上傳檔案取得 URL / key，再存到 recipientForm.verificationDocumentUrl
    this.recipientForm.verificationDocumentUrl = file.name; // 示意
    this.submitMessage = '已選取驗證文件（示意）';
  }

  onSubmit(): void {
    if (!this.selectedRole) {
      this.submitMessage = '請先選擇註冊身分。';
      return;
    }

    if (this.selectedRole === 'donor') {
      if (this.donorForm.password !== this.donorForm.confirmPassword) {
        this.submitMessage = '密碼與確認密碼不一致。';
        return;
      }
      const payload = {
        email: this.donorForm.email,
        accountName: this.donorForm.accountName,
        password: this.donorForm.password,
        fullName: this.donorForm.fullName || undefined,
        phone: this.donorForm.phone || undefined,
      };
      // TODO: 呼叫 API registerDonor(payload)
      this.submitMessage = '捐助者註冊送出（示意）';
      return;
    }

    // recipient
    if (this.selectedRole === 'recipient') {
      if (this.recipientForm.password !== this.recipientForm.confirmPassword) {
        this.submitMessage = '密碼與確認密碼不一致。';
        return;
      }
      const payload = {
        email: this.recipientForm.email,
        password: this.recipientForm.password || undefined,
        agencyName: this.recipientForm.agencyName,
        registrationNumber: this.recipientForm.registrationNumber || undefined,
        representative: this.recipientForm.representative || undefined,
        contactPhone: this.recipientForm.contactPhone || undefined,
        defaultAddress: this.recipientForm.defaultAddress || undefined,
        contactPersonName: this.recipientForm.contactPersonName || undefined,
        contactPersonPhone: this.recipientForm.contactPersonPhone || undefined,
        contactPersonEmail: this.recipientForm.contactPersonEmail || undefined,
        verificationDocumentUrl: this.recipientForm.verificationDocumentUrl || undefined,
        consentToContact: !!this.recipientForm.consentToContact,
      };
      // TODO: 呼叫 API registerAgency(payload)
      this.submitMessage = '受助者註冊送出（示意）';
      return;
    }
  }

  get isRecipient(): boolean {
    return this.selectedRole === 'recipient';
  }
}
