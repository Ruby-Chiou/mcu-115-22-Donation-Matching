import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import {VolunteerDemandService} from '../../../core/services/volunteer-demand.service';
import {  VolunteerDemand } from '../../../models/agency/vdemand';

@Component({
  selector: 'app-volunteer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './volunteer-detail.component.html',
  styleUrl: './volunteer-detail.component.scss'
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

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

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

    const data = this.volunteerDemandService
      .getDemands()
      .find(item => item.id === id);

    if (!data) {
      console.error('找不到志工需求：', id);
      this.router.navigate(['/agency/disaster']);
      return;
    }

    this.demand = data;
  }


  // =========================
  // 開啟刪除視窗
  // =========================
  openDeleteModal(): void {
    this.showDeleteModal = true;
  }


  // =========================
  // 關閉刪除視窗
  // =========================
  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }


  // =========================
  // 確定刪除
  // =========================
  confirmDelete(): void {

    if (!this.demand) {
      return;
    }

    this.volunteerDemandService.deleteDemand(
      this.demand.id
    );

    this.showDeleteModal = false;

    alert('志工需求已刪除！');

    this.router.navigate(['/agency/disaster']);
  }

}
