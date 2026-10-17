import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicDonationThankService } from '../../../../core/services/member-center/public-donation-thank.service';

@Component({
  selector: 'app-public-thank-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './public-thank-list.component.html',
  styleUrl: './public-thank-list.component.scss',
})
export class PublicThankListComponent implements OnInit {
  protected readonly thankService = inject(PublicDonationThankService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.thankService.loadMyPublicThanks();
    } catch {
      this.errorText.set('無法載入公開感謝紀錄，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }
}
