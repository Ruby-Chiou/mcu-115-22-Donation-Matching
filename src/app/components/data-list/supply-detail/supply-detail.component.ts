import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/demand';
import { SupplyDeleteComponent } from '../../modal/supply-delete/supply-delete.component';

@Component({
  selector: 'app-supply-detail',
  imports: [CommonModule, RouterLink, SupplyDeleteComponent],
  templateUrl: './supply-detail.component.html',
  styleUrl: './supply-detail.component.scss',
})
export class SupplyDetailComponent implements OnInit, AfterViewInit {
  demand?: DisasterDemand;
  showDeleteModal: boolean = false;
  listNumber?: number;

  constructor(
    private route: ActivatedRoute,
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.listNumber = Number(this.route.snapshot.queryParamMap.get('number'));

    this.demand = this.service.getDemandById(id);

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount ?? 0;
      this.demand.customConditions ??= [];
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }, 100);
  }

  // 開啟刪除視窗
  openDeleteModal() {
    this.showDeleteModal = true;
  }

  // 關閉刪除視窗
  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  // 刪除完成後返回列表
  onDeleted() {
    this.showDeleteModal = false;
    this.router.navigate(['/agency/disaster']);
  }

  goBack() {
    this.router.navigate(['/agency/disaster']);
  }
  getDeleteIds(): number[] {
    return this.demand?.id != null ? [this.demand.id] : [];
  }

  // 檢查是否有有效填寫的其他物品狀態
  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some((condition: string) => condition && condition.trim() !== '')
    );
  }

  // 取得其他物品狀態文字
  getCustomConditions(): string {
    return this.demand?.customConditions?.filter((condition) => condition && condition.trim()).join('、') || '無';
  }

  // 判斷接受 / 不接受顏色
  getConditionClass(condition?: string) {
    if (condition === '接受') {
      return 'accept';
    }

    if (condition === '不接受') {
      return 'reject';
    }

    return '';
  }

  // 顯示符號
  getConditionIcon(condition?: string) {
    if (condition === '接受') {
      return '✔';
    }

    if (condition === '不接受') {
      return '✘';
    }

    return '';
  }

  // 取得接受物資狀態文字
  getConditionsText(): string {
    if (!this.demand) {
      return '無';
    }

    const conditions = [
      {
        name: '全新',
        value: this.demand.conditions['全新'],
      },
      {
        name: '二手',
        value: this.demand.conditions['二手'],
      },
      {
        name: '有擦痕',
        value: this.demand.conditions['有擦痕'],
      },
      {
        name: '過期',
        value: this.demand.conditions['過期'],
      },
      {
        name: '毀損',
        value: this.demand.conditions['毀損'],
      },
    ];

    return (
      conditions
        .filter((condition) => condition.value)
        .map(
          (condition) =>
            `${condition.name}：<span class="${condition.value === '接受' ? 'accept' : 'reject'}">${this.getConditionIcon(condition.value)}</span> ${condition.value}`
        )
        .join(' ｜ ') || '無'
    );
  }
}
