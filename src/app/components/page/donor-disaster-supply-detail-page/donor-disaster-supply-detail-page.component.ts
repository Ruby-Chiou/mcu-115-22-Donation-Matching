import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/demand';

interface Comment {
  user: string;
  date: string;
  content: string;
}

@Component({
  selector: 'app-disaster-supply-detail-page',
  imports: [FormsModule, NgClass],
  templateUrl: './donor-disaster-supply-detail-page.component.html',
  styleUrl: './donor-disaster-supply-detail-page.component.scss',
})
export class DonorDisasterSupplyDetailPageComponent implements OnInit {

  // =========================
  // 目前查看的需求
  // =========================

  demand!: DisasterDemand;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disasterDemandService: DisasterDemandService
  ) {}

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    // ⭐ 從 DisasterDemandService 找同一筆物資
    const demand =
      this.disasterDemandService.getDemandById(id);

    if (!demand) {
      this.router.navigate(['/donor/disaster']);
      return;
    }

    this.demand = demand;
  }

  // =========================
  // 返回需求清單
  // =========================

  goBackToList(): void {
    this.router.navigate(
      ['/donor/disaster'],
      {
        queryParams: {
          section: 'material'
        }
      }
    );
  }

  // =========================
  // 前往物資捐助表單
  // =========================

  goToSupplyForm(): void {
    this.router.navigate([
      '/donor/disaster/supply/form',
      this.demand.id
    ]);
  }

  // =========================
  // 接受狀態文字
  // =========================

  getConditionText(
    condition: '接受' | '不接受' | ''
  ): string {

    if (condition === '接受') {
      return '✔ 接受';
    }

    if (condition === '不接受') {
      return '✘ 不接受';
    }

    return '未設定';
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
      content: '請問目前還需要礦泉水嗎？'
    },
    {
      user: '陳小華',
      date: '2026/08/16',
      content: '已經準備好物資，希望可以幫助到災區。'
    }
  ];

  addComment(): void {

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
}
