import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import { VolunteerDemandService } from '../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/agency/volunteer-demand';

interface Comment {
  user: string;
  date: string;
  content: string;
}

@Component({
  selector: 'app-donor-disaster-volunteer-detail-page',
  imports: [FormsModule],
  templateUrl: './donor-disaster-volunteer-detail-page.component.html',
  styleUrl: './donor-disaster-volunteer-detail-page.component.scss',
})
export class DonorDisasterVolunteerDetailPageComponent implements OnInit {
  volunteer?: VolunteerDemand;
  isLoading = true;
  loadError = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly location: Location,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    console.log('[志工詳細頁] route id：', id);

    try {
      const volunteer = await this.volunteerDemandService.getVolunteerByDatabaseId(id);

      console.log('[志工詳細頁] 查詢結果：', volunteer);

      if (!volunteer) {
        this.loadError = '找不到此筆志工需求。';

        return;
      }

      this.volunteer = volunteer;

      console.log('[志工詳細頁] volunteer 指派完成：', this.volunteer);
    } catch (error) {
      console.error('[志工詳細頁] 查詢失敗：', error);

      this.loadError = '讀取志工需求失敗。';
    } finally {
      this.isLoading = false;

      console.log('[志工詳細頁] isLoading：', this.isLoading);

      this.cdr.detectChanges();
    }
  }

  getRemaining(): number {
    return this.volunteer?.people ?? 0;
  }
  getProgress(): number {
    return 0;
  }
  goToVolunteerForm(): void {
    const id = this.volunteer?.id;

    if (id == null) {
      return;
    }

    this.router.navigate(['/donor/disaster/volunteer/form', id]);
  }
  // 返回志工需求清單

  goBackToList(): void {
    this.router.navigate(['/donor/disaster'], { queryParams: { section: 'volunteer' } });
  }
  // =========================
  // 留言
  // =========================

  newComment = '';

  comments: Comment[] = [
    {
      user: '王小明',
      date: '2026/08/17',
      content: '請問目前還需要志工嗎？',
    },
    {
      user: '陳小華',
      date: '2026/08/16',
      content: '我有時間可以協助物資搬運。',
    },
  ];

  // 發布留言
  addComment() {
    if (!this.newComment.trim()) {
      return;
    }
    this.comments.unshift({
      user: '目前使用者',
      date: this.getToday(),
      content: this.newComment.trim(),
    });

    this.newComment = '';
  }

  // 取得今天日期
  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  // 我要報名
  joinVolunteer() {
    alert('已送出志工報名！');
  }
}
