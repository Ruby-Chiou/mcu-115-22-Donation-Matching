import { Component, EventEmitter, Input, Output } from '@angular/core';

import { LoginPortal } from '../../../models/auth/app-role';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.scss'],
})
export class RoleSelectorComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() showAdmin = false;

  @Output() roleSelected = new EventEmitter<LoginPortal>();

  selectRole(role: LoginPortal): void {
    this.roleSelected.emit(role);
  }
}
