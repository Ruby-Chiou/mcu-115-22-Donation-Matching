import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';
import { DonorLoginComponent } from '../../../components/auth/donor-login/donor-login.component';
import { AgencyLoginComponent } from '../../../components/auth/agency-login/agency-login.component';
import { ForgotPasswordComponent } from '../../../components/auth/forgot-password/forgot-password.component';

type UserRole = 'donor' | 'agency';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, RoleSelectorComponent, DonorLoginComponent, AgencyLoginComponent, ForgotPasswordComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  selectedRole: UserRole | null = null;
  showRoleModal = true;
  isForgotPasswordStep = false;

  // 1. 選擇身分
  selectRole(role: UserRole): void {
    this.selectedRole = role;
    this.showRoleModal = false;
    this.isForgotPasswordStep = false;
  }

  // 2. 返回身分選擇
  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
    this.isForgotPasswordStep = false;
  }

  // 3. 前往忘記密碼步驟
  goToForgotPassword(): void {
    this.isForgotPasswordStep = true;
  }

  // 4. 返回登入
  backToLogin(): void {
    this.isForgotPasswordStep = false;
  }

  get isAgency(): boolean {
    return this.selectedRole === 'agency';
  }
}
