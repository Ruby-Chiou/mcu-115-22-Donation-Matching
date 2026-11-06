import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-shipping-guide',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './shipping-guide.component.html',
  styleUrl: './shipping-guide.component.scss',
})
export class ShippingGuideComponent {}
