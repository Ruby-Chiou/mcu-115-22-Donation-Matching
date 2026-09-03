import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';
import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';

import { VolunteerDeleteComponent } from '../../../modal/delete/volunteer-delete/volunteer-delete.component';

@Component({
  selector: 'app-volunteer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, VolunteerDeleteComponent],
  templateUrl: './volunteer-detail.component.html',
  styleUrl: './volunteer-detail.component.scss',
})
export class VolunteerDetailComponent implements OnInit {
  demand: VolunteerDemand | null = null;

  showDeleteModal = false;

  constructor(
    private volunteerDemandService: VolunteerDemandService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      console.error('找不到志工需求 ID');
      this.router.navigate(['/agency/disaster']);
      return;
    }

    this.loadDemand(id);
  }

  // =========================
  // 載入志工需求
  // =========================
  loadDemand(id: number): void {
    const data = this.volunteerDemandService.getDemands().find((item) => item.serialNo === id);

    if (!data) {
      console.error('找不到志工需求：', id);
      this.router.navigate(['/agency/disaster']);
      return;
    }

    this.demand = data;
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
    return this.demand?.serialNo != null ? [this.demand.serialNo] : [];
  }
}
