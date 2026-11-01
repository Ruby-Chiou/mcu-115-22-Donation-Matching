import { Component, inject, signal } from '@angular/core';

import { BoardAnnouncement, BoardAnnouncementService } from '../../core/services/admin/board-announcement.service';
import { ThankYouListComponent } from './thank-you-list.component';

/** 感謝牆完整頁：感謝名單 + 黑名單公告。 */
@Component({
  selector: 'app-thank-you-wall',
  standalone: true,
  imports: [ThankYouListComponent],
  templateUrl: './thank-you-wall.component.html',
  styleUrl: './thank-you-wall.component.scss',
})
export class ThankYouWallComponent {
  private readonly boards = inject(BoardAnnouncementService);

  protected readonly blacklist = signal<BoardAnnouncement[]>([]);
  readonly blacklistLoading = signal(false);
  readonly blacklistLoaded = signal(false);

  async loadBlacklist(): Promise<void> {
    if (this.blacklistLoaded() || this.blacklistLoading()) {
      return;
    }

    this.blacklistLoading.set(true);
    try {
      this.blacklist.set(await this.boards.published('blacklist'));
      this.blacklistLoaded.set(true);
    } catch {
      this.blacklist.set([]);
      this.blacklistLoaded.set(true);
    } finally {
      this.blacklistLoading.set(false);
    }
  }
}
