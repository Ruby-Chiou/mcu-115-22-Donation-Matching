import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { MemberCenterComponent } from './member-center.component';
import { MemberPlaceholderComponent } from './member-placeholder.component';

@Component({
  selector: 'app-member-entry',
  imports: [MemberCenterComponent, MemberPlaceholderComponent],
  template: `
    @if (auth.principal().role === 'donor') {
      <app-member-center />
    } @else if (auth.principal().role !== 'agency') {
      <app-member-placeholder />
    }
  `,
})
export class MemberEntryComponent {
  protected readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);

  constructor() {
    if (this.auth.principal().role === 'agency') {
      void this.router.navigateByUrl('/agency/profile');
    }
  }
}
