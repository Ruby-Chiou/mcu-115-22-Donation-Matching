import { Component, HostListener, OnInit, computed, inject, linkedSignal } from '@angular/core';

import { PublicDonationThankService } from '../../../core/services/member-center/public-donation-thank.service';

@Component({
  selector: 'app-thanks-marquee',
  standalone: true,
  templateUrl: './thanks-marquee.component.html',
  styleUrl: './thanks-marquee.component.scss',
})
export class ThanksMarqueeComponent implements OnInit {
  protected readonly thankService = inject(PublicDonationThankService);

  /** 一份清單從右到左算一遍，播完三遍就收起。 */
  readonly marqueeItems = computed(() => this.thankService.broadcasts());

  readonly scrollSeconds = computed(() => Math.max(14, this.thankService.broadcasts().length * 10));

  /** 清單一變就重播；播完三遍後停住，直到下一筆新廣播。 */
  readonly finished = linkedSignal({
    source: () => this.thankService.broadcasts(),
    computation: () => false,
  });

  isHeaderHidden = false;

  async ngOnInit(): Promise<void> {
    try {
      await this.thankService.loadBroadcasts();
    } catch {
      // 跑馬燈讀取失敗時維持空白，不擋住其他頁面。
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isHeaderHidden = window.scrollY > 70;
  }

  onMarqueeEnd(event: AnimationEvent): void {
    if (!event.animationName.includes('marquee')) {
      return;
    }

    this.finished.set(true);
  }
}
