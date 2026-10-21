import { Component, OnInit, inject, signal } from '@angular/core';

import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';

@Component({
  selector: 'app-thank-you-wall',
  imports: [],
  templateUrl: './thank-you-wall.component.html',
  styleUrl: './thank-you-wall.component.scss',
})
export class ThankYouWallComponent implements OnInit {
  protected readonly thankService = inject(PublicDonationThankService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.thankService.loadWall();
    } catch {
      this.errorText.set('無法載入感謝牆，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }
}
