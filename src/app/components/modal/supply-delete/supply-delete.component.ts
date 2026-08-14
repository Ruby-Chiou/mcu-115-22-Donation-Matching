import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';

@Component({
  selector: 'app-supply-delete',
  imports: [CommonModule],
  templateUrl: './supply-delete.component.html',
  styleUrl: './supply-delete.component.scss',
})
export class SupplyDeleteComponent {
  @Input() demandIds: number[] = [];
  @Input() deleteType: 'single' | 'batch' = 'single';

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  constructor(private service: DisasterDemandService) {}

  // 取消
  cancel() {
    this.closed.emit();
  }

  // 確定刪除
  confirmDelete() {
    this.demandIds.forEach((id) => {
      this.service.deleteDemand(id);
    });

    this.deleted.emit();
  }
}
