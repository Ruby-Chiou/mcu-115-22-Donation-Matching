import { Component, OnInit, signal } from '@angular/core';

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

  protected readonly currentRole = signal<GuideRole>('guest');

  protected readonly selectedGuide = signal<GuideType>(null);

  ngOnInit(): void {
    this.loadRole();
  }

  private loadRole(): void {
    const savedRole =
      localStorage.getItem('userRole') ??
      localStorage.getItem('role');

    if (savedRole === 'donor' || savedRole === 'agency') {
      this.currentRole.set(savedRole);
      return;
    }

    this.currentRole.set('guest');
  }

  protected selectGuide(guide: 'donor' | 'agency'): void {
    this.selectedGuide.set(guide);
  }
}
