import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PLATFORM_ANNOUNCEMENTS, PLATFORM_NEWS } from '../../../core/content/platform-feed';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class HomeInfoComponent {
  protected readonly announcements = PLATFORM_ANNOUNCEMENTS;
  protected readonly latestNewsList = PLATFORM_NEWS;
}
