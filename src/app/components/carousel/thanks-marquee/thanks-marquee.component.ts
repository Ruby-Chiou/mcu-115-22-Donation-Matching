import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-thanks-marquee',
  standalone: true,
  templateUrl: './thanks-marquee.component.html',
  styleUrl: './thanks-marquee.component.scss',
})
export class ThanksMarqueeComponent {
  isHeaderHidden = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isHeaderHidden = window.scrollY > 70;
  }
}
