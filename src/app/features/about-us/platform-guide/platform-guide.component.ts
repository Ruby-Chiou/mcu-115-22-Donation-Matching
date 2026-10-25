import { Component, OnInit, inject, signal } from '@angular/core';

import { AuthSessionService } from '../../../core/services/auth/auth-session.service';

import { PublicGuideComponent } from '../../../components/platform-guide/public-guide/public-guide.component';
import { DonorGuideComponent } from '../../../components/platform-guide/donor-guide/donor-guide.component';
import { AgencyGuideComponent } from '../../../components/platform-guide/agency-guide/agency-guide.component';

type GuideRole = 'guest' | 'donor' | 'agency';
type GuideType = 'donor' | 'agency' | null;

@Component({
  selector: 'app-platform-guide',
  standalone: true,
  imports: [
    PublicGuideComponent,
    DonorGuideComponent,
    AgencyGuideComponent,
  ],
  templateUrl: './platform-guide.component.html',
  styleUrl: './platform-guide.component.scss',
})
export class PlatformGuideComponent implements OnInit {
  private readonly auth = inject(AuthSessionService);

  protected readonly currentRole = signal<GuideRole>('guest');

  protected readonly selectedGuide = signal<GuideType>(null);

  async ngOnInit(): Promise<void> {
    await this.auth.restore();
    const role = this.auth.principal().role;
    this.currentRole.set(role === 'donor' || role === 'agency' ? role : 'guest');
  }

  protected selectGuide(guide: 'donor' | 'agency'): void {
    this.selectedGuide.set(guide);
  }
}
