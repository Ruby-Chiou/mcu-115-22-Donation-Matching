import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/user/agency';

@Component({
  selector: 'app-supply-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './supply-detail.component.html',
  styleUrl: './supply-detail.component.scss',
})
export class SupplyDetailComponent implements OnInit {
  demand?: DisasterDemand;
  showDeleteModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.demand = this.service.getDemandById(id);

    if (this.demand) {
      this.demand.remaining ??= this.demand.amount ?? 0;
      this.demand.customConditions ??= [];
      this.demand.customServiceTargets ??= [];
      this.demand.serviceTargets ??= {};
    }
  }

  // 取得勾選的服務對象，以頓號連結；若皆無則回傳 '無'
  getSelectedServiceTargets(): string {
    if (!this.demand) {
      return '無';
    }

    const selected = Object.entries(this.demand.serviceTargets || {})
      .filter(([_, value]) => value)
      .map(([key]) => key);

    return selected.length > 0 ? selected.join('、') : '無';
  }
  // 檢查是否有有效填寫的其他服務對象
  hasCustomServiceTargets(): boolean {
    return (
      Array.isArray(this.demand?.customServiceTargets) &&
      this.demand.customServiceTargets.some((target: string) => target && target.trim() !== '')
    );
  }

  // 檢查是否有有效填寫的其他物品狀態
  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some((condition: string) => condition && condition.trim() !== '')
    );
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

  // 開啟刪除 Modal
  openDeleteModal() {
    this.showDeleteModal = true;
  }

  // 關閉刪除 Modal
  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  // 確認刪除執行動作
  confirmDelete() {
    if (this.demand?.id !== undefined) {
      this.service.deleteDemand(this.demand.id);
      this.showDeleteModal = false;
      this.router.navigate(['/agency/disaster']);
    }
  }
}
