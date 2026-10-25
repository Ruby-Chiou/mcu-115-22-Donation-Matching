import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BeneficiaryPanelComponent } from '../../components/card/beneficiary-panel/beneficiary-panel.component';
import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPublicProfile } from '../../models/agency/beneficiary-public-profile';

@Component({
  selector: 'app-beneficiary-detail',
  standalone: true,
  imports: [RouterLink, BeneficiaryPanelComponent],
  templateUrl: './beneficiary-detail.component.html',
  styleUrl: './beneficiary-detail.component.scss',
})
export class BeneficiaryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly beneficiaryProfiles = inject(BeneficiaryPublicProfileService);

  protected readonly ready = signal(false);
  protected profile: BeneficiaryPublicProfile | null = null;

  async ngOnInit(): Promise<void> {
    const name = this.route.snapshot.paramMap.get('name') ?? '';
    await this.beneficiaryProfiles.ensureLoaded();
    this.profile = this.beneficiaryProfiles.find(name);
    this.ready.set(true);
  }
}
