import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';

@Component({
  selector: 'app-supply-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-delete.component.html',
  styleUrl: './supply-delete.component.scss',
})
export class SupplyDeleteComponent {
  @Input()
  demandIds: number[] = [];

  @Input()
  deleteType: 'single' | 'batch' = 'single';

  // 由父元件指定目前要刪除「災害」或「日常」物資。
  @Input()
  demandType: 'disaster' | 'daily' = 'disaster';

  @Output()
  closed = new EventEmitter<void>();

  @Output()
  deleted = new EventEmitter<void>();

  constructor(
    private readonly disasterService: DisasterDemandService,

    private readonly dailyService: DailyDemandService
  ) {}

  cancel(): void {
    this.closed.emit();
  }

  async confirmDelete(): Promise<void> {
    if (this.demandIds.length === 0) {
      return;
    }

    try {
      console.log('準備刪除物資：', {
        demandType: this.demandType,
        deleteType: this.deleteType,
        demandIds: this.demandIds,
      });

      if (this.demandType === 'disaster') {
        for (const serialNo of this.demandIds) {
          await this.disasterService.deleteDemand(serialNo);
        }
      }

      if (this.demandType === 'daily') {
        for (const serialNo of this.demandIds) {
          await this.dailyService.deleteDemand(serialNo);
        }
      }

      this.deleted.emit();
    } catch (error) {
      console.error('刪除物資需求失敗：', error);

      alert('刪除失敗，請確認資料是否存在或是否具有刪除權限。');
    }
  }
}
