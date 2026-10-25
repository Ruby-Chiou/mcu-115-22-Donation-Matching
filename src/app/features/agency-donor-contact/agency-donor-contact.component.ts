import { Component, inject, input, signal } from '@angular/core';

import { AgencyReceiptIssuanceService } from '../../core/services/agency/agency-receipt-issuance.service';

@Component({
  selector: 'app-agency-donor-contact',
  templateUrl: './agency-donor-contact.component.html',
  styleUrl: './agency-donor-contact.component.scss',
})
export class AgencyDonorContactComponent {
  private readonly receipts = inject(AgencyReceiptIssuanceService);

  readonly donorUid = input('');
  readonly donorName = input('');
  readonly phone = input('');

  protected content = '';
  protected readonly sending = signal(false);
  protected readonly notice = signal('');
  protected readonly errorText = signal('');

  protected async send(): Promise<void> {
    this.sending.set(true);
    this.notice.set('');
    this.errorText.set('');

    try {
      await this.receipts.contactDonor(this.donorUid(), this.donorName(), this.content);
      this.content = '';
      this.notice.set('站內信已送到捐助者的收件匣。');
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '站內信沒有送出。');
    } finally {
      this.sending.set(false);
    }
  }
}
