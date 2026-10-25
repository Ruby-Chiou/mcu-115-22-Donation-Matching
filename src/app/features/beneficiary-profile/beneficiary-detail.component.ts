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
    this.profile = this.beneficiaryProfiles.find(name) ?? this.profileFromNavigation(name);
    this.ready.set(true);
  }

  private profileFromNavigation(name: string): BeneficiaryPublicProfile | null {
    const carried = history.state?.['beneficiaryProfile'] as BeneficiaryPublicProfile | undefined;

    if (!carried || carried.organizationName?.trim() !== name.trim()) {
      return null;
    }

    return {
      organizationName: carried.organizationName,
      city: carried.city ?? '',
      image: carried.image ?? '',
      introImages: Array.isArray(carried.introImages) ? carried.introImages : [],
      establishedYear: carried.establishedYear ?? '',
      registrationLabel: carried.registrationLabel ?? '',
      serviceArea: carried.serviceArea ?? '',
      serviceTargets: Array.isArray(carried.serviceTargets) ? carried.serviceTargets : [],
      publicPhone: carried.publicPhone ?? '',
      mission: carried.mission ?? '',
      background: carried.background ?? '',
      verified: carried.verified === true,
      address: carried.address ?? '',
      websiteUrl: carried.websiteUrl ?? '',
      latitude: carried.latitude ?? null,
      longitude: carried.longitude ?? null,
    };
  }
}
