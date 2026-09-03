import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';

@Component({
  selector: 'app-supply-delete',
  imports: [CommonModule],
  templateUrl: './supply-delete.component.html',
  styleUrl: './supply-delete.component.scss',
})
export class SupplyDeleteComponent {
  @Input() demandIds: number[] = [];

  @Input() deleteType: 'single' | 'batch' = 'single';

  // 判斷要刪除急難還是日常
  @Input() demandType: 'disaster' | 'daily' = 'disaster';

  @Output() closed = new EventEmitter<void>();

  @Output() deleted = new EventEmitter<void>();

  constructor(
    private disasterService: DisasterDemandService,
    private dailyService: DailyDemandService
  ) {}

  // 取消
  cancel() {
    this.closed.emit();
  }

  // 確定刪除
  confirmDelete() {
    this.demandIds.forEach((serialNo) => {
      if (this.demandType === 'daily') {
        this.dailyService.deleteDemand(serialNo);
      } else {
        this.disasterService.deleteDemand(serialNo);
      }
    });

    this.deleted.emit();
  }
}
