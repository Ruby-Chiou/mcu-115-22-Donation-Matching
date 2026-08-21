import { Component , Input} from '@angular/core';
import { DisasterOpenCardComponent } from '../../../components/card/disaster-open-card/disaster-open-card.component';

@Component({
  selector: 'app-disaster-open-card-list',
  imports: [DisasterOpenCardComponent],
  templateUrl: './disaster-open-card-list.component.html',
  styleUrl: './disaster-open-card-list.component.scss',
})
export class DisasterOpenCardListComponent {
   @Input() type: 'material' | 'volunteer' = 'material';
}
