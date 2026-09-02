import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

@Component({
  selector: 'app-donor-daily-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './donor-daily-detail.component.html',
  styleUrl: './donor-daily-detail.component.scss',
})
export class DonorDailyDetailComponent implements OnInit, OnDestroy {

  demand?: DailyDemand;
  currentImageIndex = 0;
  private imageTimer?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private dailyDemandService: DailyDemandService,
    private cdr: ChangeDetectorRef // 注入 ChangeDetectorRef 以強制觸發變更偵測
  ) {}

  ngOnInit(): void {
    // 訂閱 paramMap 確保路由參數改變時能正確更新
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.loadDemandData(id);
    });
  }

  // 載入資料並啟動輪播
  private loadDemandData(id: number): void {
    this.stopImageTimer(); // 重置前一個計時器
    this.currentImageIndex = 0;

    // 取得需求資料
    this.demand = this.dailyDemandService.getDemandById(id);

    console.log('目前需求：', this.demand);
    console.log('圖片數量：', this.demand?.image?.length);

    this.startImageTimer();
  }

  // 啟動輪播計時器
  private startImageTimer(): void {
    this.stopImageTimer(); // 確保不會重複啟動多個計時器

    if (this.demand?.image && this.demand.image.length > 1) {
      this.imageTimer = setInterval(() => {
        if (!this.demand?.image?.length) return;

        this.currentImageIndex =
          (this.currentImageIndex + 1) % this.demand.image.length;

        console.log('自動切換圖片：', this.currentImageIndex);

        // 手動通知 Angular 畫面需要更新
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  // 停止輪播計時器
  private stopImageTimer(): void {
    if (this.imageTimer) {
      clearInterval(this.imageTimer);
      this.imageTimer = undefined;
    }
  }

  // 點擊圓點切換圖片
  goToImage(index: number): void {
    this.currentImageIndex = index;
    // 點擊後重新計時，避免使用者剛點完又被自動輪播切走
    this.startImageTimer();
  }

  // 元件銷毀時清除計時器
  ngOnDestroy(): void {
    this.stopImageTimer();
  }

  // =========================
  // 取得接收方式文字
  // =========================
  getReceiveMethod(): string {
    if (!this.demand?.receiveMethod) {
      return '';
    }

    const methods = [];

    if (this.demand.receiveMethod.寄送) {
      methods.push('寄送');
    }

    if (this.demand.receiveMethod.面交) {
      methods.push('面交');
    }

    return methods.join('、');
  }

  // =========================
  // 取得服務對象文字
  // =========================
  getServiceTargets(): string {
    if (!this.demand?.serviceTargets) {
      return '';
    }

    const targets = [];

    for (const [key, value] of Object.entries(
      this.demand.serviceTargets
    )) {
      if (value) {
        targets.push(key);
      }
    }

    return targets.join('、') || '無';
  }

  // =========================
  // 判斷是否有自訂狀態
  // =========================
  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some(
        (condition: string) =>
          condition && condition.trim() !== ''
      )
    );
  }

  // =========================
  // 取得優先度 CSS
  // =========================
  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case '非常緊急':
        return 'priority-urgent';

      case '緊急':
        return 'priority-normal';

      case '普通':
        return 'priority-low';

      default:
        return 'priority-default';
    }
  }

  // =========================
  // 地址只顯示到區／鄉鎮市
  // =========================
  getRegion(address: string | undefined): string {
    if (!address) {
      return '';
    }

    const match = address.match(
      /^(.*?[縣市].*?[區鄉鎮市])/
    );

    return match ? match[1] : address;
  }

  // =========================
  // 物資狀態要求
  // =========================
  getConditions(): string {
    const conditions = this.demand?.conditions;

    if (!conditions) {
      return '無';
    }

    return Object.entries(conditions)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}：${value}`)
      .join('、');
  }
}
