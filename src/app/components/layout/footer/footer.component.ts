import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly auth = inject(AuthSessionService);

  protected get signedIn(): boolean {
    return this.auth.principal().role !== 'guest';
  }
}
