import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicDonationThankService } from '../../../../core/services/member-center/public-donation-thank.service';
import { PublicDonationThank, ThankNameMode } from '../../../../models/member/public-donation-thank';

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
  readonly savingId = signal<number | null>(null);
  readonly saveMessage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.thankService.loadMyPublicThanks();
    } catch {
      this.errorText.set('無法載入公開感謝紀錄，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(item: PublicDonationThank, nameMode: ThankNameMode, isPublic: boolean): Promise<void> {
    this.savingId.set(item.id);
    this.saveMessage.set('');

    try {
      await this.thankService.setThankVisibility(item, nameMode, isPublic);
      await this.thankService.loadMyPublicThanks();
      this.saveMessage.set('顯示方式已更新。');
    } catch {
      this.saveMessage.set('顯示方式沒有更新，請稍後再試。');
    } finally {
      this.savingId.set(null);
    }
  }
}
