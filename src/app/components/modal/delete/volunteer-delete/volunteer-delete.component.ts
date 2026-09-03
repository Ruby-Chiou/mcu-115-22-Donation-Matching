import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';

@Component({
  selector: 'app-volunteer-delete',
  imports: [CommonModule],
  templateUrl: './volunteer-delete.component.html',
  styleUrl: './volunteer-delete.component.scss',
})
export class VolunteerDeleteComponent {
  @Input() demandIds: number[] = [];
  @Input() deleteType: 'single' | 'batch' = 'single';

  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  constructor(private service: VolunteerDemandService) {}

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
