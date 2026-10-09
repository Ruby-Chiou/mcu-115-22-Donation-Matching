import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type GuideRole = 'guest' | 'donor' | 'agency';

@Component({
  selector: 'app-agency-guide',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './agency-guide.component.html',
  styleUrl: './agency-guide.component.scss',
})
export class AgencyGuideComponent {
  @Input() currentRole: GuideRole = 'guest';
}
