import { Component, signal } from '@angular/core';

import { AgencyCertificateListComponent } from './agency-certificate-list/agency-certificate-list.component';
import { DonationReceiptListComponent } from './donation-receipt-list/donation-receipt-list.component';
import { PublicThankListComponent } from './public-thank-list/public-thank-list.component';

export type AcknowledgementSection = 'receipts' | 'certificates' | 'public';

@Component({
  selector: 'app-member-acknowledgements',
  imports: [DonationReceiptListComponent, AgencyCertificateListComponent, PublicThankListComponent],
  templateUrl: './member-acknowledgements.component.html',
  styleUrl: './member-acknowledgements.component.scss',
})
export class MemberAcknowledgementsComponent {
  readonly activeSection = signal<AcknowledgementSection>('receipts');

  selectSection(section: AcknowledgementSection): void {
    this.activeSection.set(section);
  }
}
