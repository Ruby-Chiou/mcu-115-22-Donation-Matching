import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type DonationStation = 'review' | 'receipt' | 'delivery';

@Component({
  selector: 'app-donation-record-links',
  imports: [RouterLink],
  templateUrl: './donation-record-links.component.html',
  styleUrl: './donation-record-links.component.scss',
})
export class DonationRecordLinksComponent {
  readonly donationId = input.required<string>();
  readonly current = input.required<DonationStation>();
  readonly showCurrent = input(true);
  readonly showLabel = input(true);

  protected readonly stations = computed(() => {
    const id = this.donationId();

    return [
      { id: 'review' as const, label: '物資審核', commands: ['/agency/item-review', id], query: {} },
      { id: 'receipt' as const, label: '捐助發票', commands: ['/agency/receipt-review'], query: { donation: id } },
      { id: 'delivery' as const, label: '收件確認', commands: ['/agency/delivery-confirm'], query: { id } },
    ];
  });
}
