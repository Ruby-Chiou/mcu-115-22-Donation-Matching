import { Component, OnInit, inject, signal } from '@angular/core';

import { BoardAnnouncement, BoardAnnouncementService } from '../../core/services/admin/board-announcement.service';
import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';

@Component({
  selector: 'app-thank-you-wall',
  imports: [],
  templateUrl: './thank-you-wall.component.html',
  styleUrl: './thank-you-wall.component.scss',
})
export class ThankYouWallComponent implements OnInit {
  protected readonly thankService = inject(PublicDonationThankService);
  private readonly boards = inject(BoardAnnouncementService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  protected readonly wallNotices = signal<BoardAnnouncement[]>([]);
  protected readonly blacklist = signal<BoardAnnouncement[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const [wall, blacklist] = await Promise.all([
        this.thankService.loadWall().then(() => this.boards.published('thank_wall')),
        this.boards.published('blacklist'),
      ]);
      this.wallNotices.set(wall.filter((item) => !item.donorUid));
      this.blacklist.set(blacklist.filter((item) => item.donorUid));
    } catch {
      this.errorText.set('無法載入感謝牆，請稍後再試。');
      this.blacklist.set((await this.boards.published('blacklist')).filter((item) => item.donorUid));
    } finally {
      this.isLoading.set(false);
    }
  }
}
