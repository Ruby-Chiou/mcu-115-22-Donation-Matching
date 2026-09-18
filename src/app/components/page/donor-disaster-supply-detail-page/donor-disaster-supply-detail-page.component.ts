import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SupplyDetailCarouselComponent } from '../../carousel/supply-detail-carousel/supply-detail-carousel.component';

import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/disaster-demand';

interface Comment {
  user: string;
  date: string;
  content: string;
}
@Component({
  selector: 'app-disaster-supply-detail-page',
  imports: [FormsModule, NgClass, SupplyDetailCarouselComponent],
  templateUrl: './donor-disaster-supply-detail-page.component.html',
  styleUrl: './donor-disaster-supply-detail-page.component.scss',
})
export class DonorDisasterSupplyDetailPageComponent implements OnInit {
  // =========================
  // 目前查看的需求
  // =========================
  demand!: DisasterDemand;

  isLoading = true;
  loadError = '';
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly disasterDemandService: DisasterDemandService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    console.log('[災害詳細頁] route id：', rawId);

    const id = Number(rawId);

    console.log('[災害詳細頁] number id：', id);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[災害詳細頁] 無效的資料庫 id：', id);

      this.loadError = '網址中的災害物資編號不正確。';

      this.isLoading = false;
      return;
    }

    try {
      console.log('[災害詳細頁] 開始查詢資料');

      const demand = await this.disasterDemandService.getDemandById(id);

      console.log('[災害詳細頁] 查詢結果：', demand);

      if (!demand) {
        this.loadError = '找不到此筆災害物資需求。';

        return;
      }

      this.demand = demand;

      console.log('[災害詳細頁] demand 指派完成：', this.demand);
    } catch (error) {
      console.error('[災害詳細頁] 查詢失敗：', error);

      this.loadError = '讀取災害物資資料失敗，請稍後再試。';
    } finally {
      this.isLoading = false;

      console.log('[災害詳細頁] isLoading：', this.isLoading);

      // 強制 Angular 重新判斷 @if (isLoading) 與 @else if (demand)
      this.cdr.detectChanges();
    }
  }

  // =========================
  // 前往物資捐助表單
  // =========================
  goToSupplyForm(): void {
    this.router.navigate(['/donor/disaster/supply/form', this.demand.id]);
  }

  // =========================
  // 返回需求清單
  // =========================
  goBackToList(): void {
    this.router.navigate(['/donor/disaster'], {
      queryParams: {
        section: 'material',
      },
    });
  }
  // =========================
  // 接受狀態文字
  // =========================
  getConditionText(condition: '接受' | '不接受' | ''): string {
    if (condition === '接受') {
      return '✔ 接受';
    }
    if (condition === '不接受') {
      return '✘ 不接受';
    }
    return '';
  }
  // =========================
  // 緊急程度樣式
  // =========================
  getPriorityClass(): string {
    switch (this.demand.priority) {
      case '非常緊急':
        return 'very-urgent';
      case '緊急':
        return 'urgent';
      default:
        return 'normal';
    }
  }
  // =========================
  // 留言
  // =========================
  newComment = '';
  comments: Comment[] = [
    {
      user: '王小明',
      date: '2026/08/17',
      content: '請問目前還需要礦泉水嗎？',
    },
    {
      user: '陳小華',
      date: '2026/08/16',
      content: '已經準備好物資，希望可以幫助到災區。',
    },
  ];
  addComment(): void {
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
  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}
