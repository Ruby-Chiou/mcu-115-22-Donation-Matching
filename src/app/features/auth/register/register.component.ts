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

  recipientForm = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    registrationNumber: '',
    representative: '',
    contactPhone: '',
    defaultAddress: '',
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
      this.submitMessage = '捐助者註冊送出（示意）';
      return;
    }

    if (this.selectedRole === 'recipient') {
      if (this.recipientForm.password !== this.recipientForm.confirmPassword) {
        this.submitMessage = '密碼與確認密碼不一致。';
        return;
      }
      this.submitMessage = '受助者註冊送出（示意）';
    }
  }

  get isRecipient(): boolean {
    return this.selectedRole === 'recipient';
  }
}
