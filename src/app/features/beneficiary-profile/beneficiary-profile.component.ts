import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';

@Component({
  selector: 'app-beneficiary-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './beneficiary-profile.component.html',
  styleUrl: './beneficiary-profile.component.scss',
})
export class BeneficiaryProfileComponent {
  private readonly beneficiaryProfiles = inject(BeneficiaryPublicProfileService);

  protected readonly ready = this.beneficiaryProfiles.ready;
  protected readonly loadError = this.beneficiaryProfiles.loadError;
  protected readonly activeCity = signal('全部');
  protected readonly cities = computed(() => this.beneficiaryProfiles.cities());
  protected readonly profiles = computed(() => {
    const city = this.activeCity();
    const all = this.beneficiaryProfiles.profiles();
    return city === '全部' ? all : all.filter((profile) => profile.city === city);
  });

  constructor() {
    void this.beneficiaryProfiles.ensureLoaded();
  }

  selectCity(city: string): void {
    this.activeCity.set(city);
  }
}
