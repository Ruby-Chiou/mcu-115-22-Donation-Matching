import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  isHeaderHidden = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isHeaderHidden = window.scrollY > 70;
  }
}
