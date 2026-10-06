import { Component } from '@angular/core';

import { HomeHeroComponent } from '../../components/home/hero/hero.component';
import { HomeQuickLinksComponent } from '../../components/home/quick-links/quick-links.component';
import { HomeInfoComponent } from '../../components/home/info/info.component';
import { AboutComponent } from '../../components/home/about/about.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HomeHeroComponent,
    HomeQuickLinksComponent,
    HomeInfoComponent,
    AboutComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
