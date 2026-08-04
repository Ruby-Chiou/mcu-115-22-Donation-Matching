import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss'
})
export class TrackingComponent {

  keyword = '';

  trackingList = [
    {
      id: 'A001',
      name: '花蓮救災行動',
      status: '配送中'
    },
  ];

  resultList = this.trackingList;

  search() {
    this.resultList = this.trackingList.filter(item =>
      item.name.includes(this.keyword) ||
      item.id.includes(this.keyword)
    );
  }
}
