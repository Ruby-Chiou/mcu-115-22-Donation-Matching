import { Component, EventEmitter, Input, Output } from '@angular/core';

export type UserRole = 'donor' | 'agency';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.scss'],
})
export class RoleSelectorComponent {
  @Input() title = '';
  @Input() description = '';

  @Output() roleSelected = new EventEmitter<UserRole>();

  selectRole(role: UserRole): void {
    this.roleSelected.emit(role);
  }
}
