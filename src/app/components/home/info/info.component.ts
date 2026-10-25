import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PLATFORM_ANNOUNCEMENTS, PLATFORM_NEWS, PlatformAnnouncement } from '../../../core/content/platform-feed';
import { PlatformAnnouncementService } from '../../../core/services/admin/platform-announcement.service';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class HomeInfoComponent {
  private readonly announcementService = inject(PlatformAnnouncementService);

  protected readonly announcements = signal<PlatformAnnouncement[]>([...PLATFORM_ANNOUNCEMENTS]);
  protected readonly latestNewsList = PLATFORM_NEWS;

  constructor() {
    void this.loadAnnouncements();
  }

  private async loadAnnouncements(): Promise<void> {
    try {
      this.announcements.set(await this.announcementService.published());
    } catch (error) {
      console.error('載入平台公告失敗：', error);
    }
  }
}
