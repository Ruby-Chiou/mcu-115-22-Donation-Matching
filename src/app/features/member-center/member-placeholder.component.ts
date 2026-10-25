import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_ROLE_LABEL } from '../../models/auth/app-role';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-member-placeholder',
  imports: [RouterLink],
  templateUrl: './member-placeholder.component.html',
  styleUrl: './member-placeholder.component.scss',
})
export class MemberPlaceholderComponent {
  private readonly auth = inject(AuthSessionService);

  protected get roleLabel(): string {
    return APP_ROLE_LABEL[this.auth.principal().role];
  }

  protected get homeLink(): string {
    return this.auth.principal().role === 'admin' ? '/admin/dashboard' : '/agency/dashboard';
  }

  protected get homeLabel(): string {
    return this.auth.principal().role === 'admin' ? '回到管理者總覽中心' : '回到社福機構總控制台';
  }
}
