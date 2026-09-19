import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    const id = Number(rawId);

    console.log('[VolunteerDetailComponent] 取得路由資料庫 id：', {
      rawId,
      id,
    });

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[VolunteerDetailComponent] 網址中的志工需求 id 不正確：', rawId);

      this.router.navigate(['/agency/disaster']);

      return;
    }

    await this.loadDemand(id);
  }

  /**
   * 直接從 Supabase 以資料庫主鍵 id 載入。
   * 不依賴 getDemands() 記憶體資料，
   * 因此重整頁面後仍可正常取得資料。
   */
  async loadDemand(id: number): Promise<void> {
    try {
      const data = await this.volunteerDemandService.getDemandById(id);

      console.log('[VolunteerDetailComponent] Service 回傳資料：', data);

      if (!data) {
        console.error('找不到志工需求：', id);

        this.router.navigate(['/agency/disaster']);

        return;
      }

      this.demand = {
        ...data,
      };

      this.cdr.detectChanges();

      console.log('[VolunteerDetailComponent] 已設定 this.demand：', this.demand);
    } catch (error) {
      console.error('[VolunteerDetailComponent] 載入志工需求失敗：', error);

      this.router.navigate(['/agency/disaster']);
    }
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  onDeleted(): void {
    this.showDeleteModal = false;

    this.router.navigate(['/agency/disaster']);
  }

  goBack(): void {
    this.router.navigate(['/agency/disaster']);
  }

  /**
   * 刪除 Modal 必須接收資料庫 id，
   * 不可再傳 serialNo。
   */
  getDeleteIds(): number[] {
    return this.demand?.id != null ? [this.demand.id] : [];
  }
}
