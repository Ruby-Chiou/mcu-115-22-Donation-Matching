import { Component, Input, inject } from '@angular/core';

import { SupplyDetailCarouselComponent } from '../../carousel/supply-detail-carousel/supply-detail-carousel.component';
import { BeneficiaryPublicProfileService } from '../../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPublicProfile } from '../../../models/agency/beneficiary-public-profile';

@Component({
  selector: 'app-beneficiary-panel',
  imports: [SupplyDetailCarouselComponent],
  templateUrl: './beneficiary-panel.component.html',
  styleUrl: './beneficiary-panel.component.scss',
})
export class BeneficiaryPanelComponent {
  private readonly profiles = inject(BeneficiaryPublicProfileService);

  @Input({ required: true }) profile!: BeneficiaryPublicProfile;

  fields() {
    return this.profiles.fields(this.profile);
  }
}
