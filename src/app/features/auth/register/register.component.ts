import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RoleSelectorComponent } from '../../../components/auth/role-selector/role-selector.component';
import { DonorRegisterComponent } from '../../../components/auth/donor-register/donor-register.component';
import { AgencyRegisterComponent } from '../../../components/auth/agency-register/agency-register.component';
import { LoginPortal } from '../../../models/auth/app-role';

type UserRole = Exclude<LoginPortal, 'admin'>;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RoleSelectorComponent, DonorRegisterComponent, AgencyRegisterComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  selectedRole: UserRole | null = null;
  showRoleModal = true;

  selectRole(role: LoginPortal): void {
    if (role === 'admin') {
      return;
    }

    this.selectedRole = role;
    this.showRoleModal = false;
  }

  backToRoleSelection(): void {
    this.selectedRole = null;
    this.showRoleModal = true;
  }

  get isAgency(): boolean {
    return this.selectedRole === 'agency';
  }
}
