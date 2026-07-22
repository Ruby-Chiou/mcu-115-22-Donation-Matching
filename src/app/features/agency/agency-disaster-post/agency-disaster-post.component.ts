import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-post',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-disaster-post.component.html',
  styleUrl: './agency-disaster-post.component.scss',
})
export class AgencyDisasterPostComponent implements OnInit {
  demands: any[] = [];

  selectAll = false;

  // =========================
  // 刪除提示視窗控制
  // =========================

  showDeleteModal = false;

  deleteId!: number;

  deleteType: 'single' | 'batch' = 'single';

  constructor(
    private disasterDemandService: DisasterDemandService,

    private router: Router
  ) {}

  ngOnInit() {
    this.loadDemands();
  }

  // 載入資料

  loadDemands() {
    this.demands = this.disasterDemandService.getDemands().map((item) => ({
      ...item,

      selected: false,

      status: item.status || '已上架',
    }));
  }

  // 全選

  toggleAll() {
    this.demands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  // 判斷是否選取

  hasSelected() {
    return this.demands.some((item) => item.selected);
  }

  // 批次修改

  editSelected() {
    const selectedItems = this.demands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');

      return;
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));

    this.router.navigate(['/agency/disaster-batch-edit']);
  }

  // =========================
  // 開啟刪除視窗
  // =========================

  openDeleteModal(id: number) {
    this.deleteId = id;

    this.deleteType = 'single';

    this.showDeleteModal = true;
  }

  // 批次刪除開啟視窗

  openBatchDeleteModal() {
    this.deleteType = 'batch';

    this.showDeleteModal = true;
  }

  // 確認刪除

  confirmDelete() {
    // 單筆刪除

    if (this.deleteType === 'single') {
      this.disasterDemandService.deleteDemand(this.deleteId);
    }

    // 批次刪除
    else {
      const ids = this.demands

        .filter((item) => item.selected)

        .map((item) => item.id);

      ids.forEach((id) => {
        this.disasterDemandService.deleteDemand(id);
      });

      this.selectAll = false;
    }

    this.loadDemands();

    this.closeDeleteModal();
  }

  // 關閉視窗

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  // 修改上架狀態

  changeStatus(item: any) {
    this.disasterDemandService.updateDemand(item);
  }
}
