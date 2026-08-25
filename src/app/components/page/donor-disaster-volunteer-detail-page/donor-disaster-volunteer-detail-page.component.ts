import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

interface Comment {
  user: string;
  date: string;
  content: string;
}

@Component({
  selector: 'app-donor-disaster-volunteer-detail-page',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './donor-disaster-volunteer-detail-page.component.html',
  styleUrl: './donor-disaster-volunteer-detail-page.component.scss',
})
export class DonorDisasterVolunteerDetailPageComponent implements OnInit {
  volunteer!: VolunteerDemand;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private volunteerDemandService: VolunteerDemandService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const volunteer = this.volunteerDemandService.getVolunteerById(id);

    if (!volunteer) {
      this.router.navigate(['/disaster/open']);
      return;
    }

    this.volunteer = volunteer;
  }

  getRemaining(): number {
    return Math.max(this.volunteer.required - this.volunteer.registered, 0);
  }

  getProgress(): number {
    return this.volunteer.required > 0
      ? Math.min((this.volunteer.registered / this.volunteer.required) * 100, 100)
      : 0;
  }
  goToVolunteerForm() {
    this.router.navigate(['/disaster/open/volunteer/form', this.volunteer.id]);
  }
// 返回志工需求清單
  goBackToList() {
    this.router.navigate(['/disaster/open']);
  }

// =========================
// 留言
// =========================

  newComment = '';

  comments: Comment[] = [
  {
  user: '王小明',
  date: '2026/08/17',
  content: '請問目前還需要志工嗎？'
  },
  {
  user: '陳小華',
  date: '2026/08/16',
  content: '我有時間可以協助物資搬運。'
  }
  ];

  // 發布留言
  addComment() {

  if (!this.newComment.trim()) {
    return;
  }
  this.comments.unshift({
    user: '目前使用者',
    date: this.getToday(),
    content: this.newComment.trim()
  });

  this.newComment = '';
  }

  // 取得今天日期
  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      today.getDate()
    ).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  // 我要報名
  joinVolunteer() {
    alert('已送出志工報名！');
  }
}
