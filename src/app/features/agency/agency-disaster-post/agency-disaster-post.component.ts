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

      // 列表用，不存資料庫

      selected: false,

      // 沒有狀態預設上架

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

  // 批次刪除

  deleteSelected() {
    const confirmDelete = confirm('是否確認刪除選取的需求？');

    if (confirmDelete) {
      const ids = this.demands.filter((item) => item.selected).map((item) => item.id);

      ids.forEach((id) => {
        this.disasterDemandService.deleteDemand(id);
      });

      this.loadDemands();

      this.selectAll = false;
    }
  }

  // 單筆刪除

  deleteDemand(id: number) {
    const confirmDelete = confirm('是否確認要刪除？');

    if (confirmDelete) {
      this.disasterDemandService.deleteDemand(id);

      this.loadDemands();
    }
  }

  // 修改上架狀態

  changeStatus(item: any) {
    this.disasterDemandService.updateDemand(item);
  }
}
