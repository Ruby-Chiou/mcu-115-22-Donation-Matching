import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HelperDemand } from '../../../../models/agency/helper-demand';
import { HelperDemandService } from '../../../../core/services/agency-helper-demand/helper-demand.service';

import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-helper-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './helper-detail.component.html',
  styleUrl: './helper-detail.component.scss',
})
export class HelperDetailComponent implements OnInit {
  demand: HelperDemand | null = null;

  showDeleteModal = false;

  constructor(
    private readonly helperDemandService: HelperDemandService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    const id = Number(rawId);

    console.log('[HelperDetailComponent] 取得路由資料庫 id：', {
      rawId,
      id,
    });

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[HelperDetailComponent] 網址中的協力需求 id 不正確：', rawId);

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
      const data = await this.helperDemandService.getDemandById(id);

      console.log('[HelperDetailComponent] Service 回傳資料：', data);

      if (!data) {
        console.error('找不到協力需求：', id);

        this.router.navigate(['/agency/disaster']);

        return;
      }

      this.demand = {
        ...data,
      };

      this.cdr.detectChanges();

      console.log('[HelperDetailComponent] 已設定 this.demand：', this.demand);
    } catch (error) {
      console.error('[HelperDetailComponent] 載入協力需求失敗：', error);

      this.router.navigate(['/agency/disaster']);
    }
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  async confirmDelete(): Promise<void> {
    const ids = this.getDeleteIds();
    if (ids.length === 0) {
      return;
    }

    try {
      for (const id of ids) {
        await this.helperDemandService.deleteDemand(id);
      }
      this.onDeleted();
    } catch (error) {
      console.error('刪除協力需求失敗：', error);
      alert('刪除失敗，請確認資料是否存在或是否具有刪除權限。');
    }
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
