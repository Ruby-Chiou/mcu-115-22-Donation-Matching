import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-links',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quick-links.component.html',
  styleUrl: './quick-links.component.scss',
})
export class HomeQuickLinksComponent {
  constructor(private router: Router) {}

  protected goToDisaster(event: Event): void {
    event.preventDefault();

    this.router.navigate(['/donor/disaster']);
  }
}
