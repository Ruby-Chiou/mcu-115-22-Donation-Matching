import { Component,Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-disaster-open-card',
  imports: [],
  templateUrl: './disaster-open-card.component.html',
  styleUrl: './disaster-open-card.component.scss',
})
export class DisasterOpenCardComponent {
  @Input() type: 'material' | 'volunteer' = 'material';
  showDetail = false;
  progress = 50;
  constructor( private router: Router  ) {}

  // 點整張卡片
  goToFullDetail(event: Event) {
    event.stopPropagation();
    // 關閉彈跳視窗
    this.showDetail = false;
    // 物資

    if (this.type === 'material') {
    this.router.navigate(['/disaster/open/detail']);
    return;
    }
    // 志工
    if (this.type === 'volunteer') {
    this.router.navigate(['/disaster/open/volunteer/detail']);
    return;
    }
}

  // 點「了解詳情」
  openDetail(event: Event) {
    event.stopPropagation();
    this.showDetail = true;

  }
  // 關閉彈跳視窗
  closeDetail(event?: Event) {
    event?.stopPropagation();
    this.showDetail = false;
  }

}
