import { Component } from '@angular/core';

import { HomeHeroComponent } from '../../components/home/hero/hero.component';
import { HomeQuickLinksComponent } from '../../components/home/quick-links/quick-links.component';
import { HomeInfoComponent } from '../../components/home/info/info.component';
import { AboutComponent } from '../../components/home/about/about.component';
import { UrgentDailyCarouselComponent } from '../../components/home/urgent-daily-carousel/urgent-daily-carousel.component';
import { ThankYouListComponent } from '../thank-you-wall/thank-you-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HomeHeroComponent,
    HomeQuickLinksComponent,
    HomeInfoComponent,
    UrgentDailyCarouselComponent,
    AboutComponent,
    ThankYouListComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
