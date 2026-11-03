import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { isExternalNewsLink, PLATFORM_ANNOUNCEMENTS, PLATFORM_NEWS, PlatformAnnouncement } from '../../../core/content/platform-feed';
import { PlatformAnnouncementService } from '../../../core/services/admin/platform-announcement.service';
import { DisasterClosedModalService } from '../../../core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class HomeInfoComponent {
  private readonly announcementService = inject(PlatformAnnouncementService);
  private readonly disaster = inject(DisasterControlService);
  private readonly closedModal = inject(DisasterClosedModalService);

  protected readonly announcements = signal<PlatformAnnouncement[]>([...PLATFORM_ANNOUNCEMENTS]);

  /** 外網災情／救援連結一律保留；僅在災害關閉時隱藏導向站內災害專區的消息。 */
  protected readonly latestNewsList = computed(() => {
    const open = this.disaster.data().isOpen;
    return PLATFORM_NEWS.filter((news) => {
      if (isExternalNewsLink(news.link)) {
        return true;
      }
      if (open) {
        return true;
      }
      return !news.link.includes('/donor/disaster');
    });
  });

  protected readonly isExternalNewsLink = isExternalNewsLink;

  constructor() {
    void this.loadAnnouncements();
  }

  protected onNewsClick(event: Event, link: string): void {
    if (link.includes('/donor/disaster') && !this.disaster.data().isOpen) {
      event.preventDefault();
      this.closedModal.show();
    }
  }

  private async loadAnnouncements(): Promise<void> {
    try {
      this.announcements.set(await this.announcementService.published());
    } catch (error) {
      console.error('載入平台公告失敗：', error);
    }
  }
}
