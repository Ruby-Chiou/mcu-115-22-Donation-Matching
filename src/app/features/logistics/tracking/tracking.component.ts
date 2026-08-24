import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss'
})
export class TrackingComponent {
  showResult = false;

  keyword = '';

  trackingList = [
    {
      id: 'A001',
      status: '配送中'
    },
    {
      id: 'A002',
      status: '已送達'
    }
  ];

  resultList = this.trackingList;

  search() {

  // 去除前後空白
  const keyword = this.keyword.trim();

  // 沒有輸入任何文字
  if (!keyword) {
    alert('請先輸入物流單號！');
    this.showResult = false;
    return;
  }
    this.resultList = this.trackingList.filter(item =>
      item.id.includes(this.keyword)
    );
    if (this.resultList.length === 0) {
    alert('查無此資訊');
  } else {
    this.keyword = '';
  }
    this.showResult = true;
  }
}
