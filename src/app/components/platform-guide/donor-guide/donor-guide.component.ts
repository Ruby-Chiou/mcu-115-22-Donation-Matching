import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-donor-guide',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './donor-guide.component.html',
  styleUrl: './donor-guide.component.scss',
})
export class DonorGuideComponent {}
