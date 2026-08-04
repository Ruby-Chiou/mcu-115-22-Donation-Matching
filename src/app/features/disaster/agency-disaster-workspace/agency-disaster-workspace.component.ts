import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../../../components/core/services/disaster-demand.service';
import { DisasterDemand, DisasterStatus, DisplayStatus } from '../../../models/user/agency';

@Component({
  selector: 'app-agency-disaster-workspace',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent implements OnInit {
  demands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
  })[] = [];

  filteredDemands: (DisasterDemand & {
    selected: boolean;
    displayStatus: DisplayStatus;
  })[] = [];

  selectAll = false;

  // =========================
  // 刪除提示視窗控制
  // =========================
  showDeleteModal = false;
  deleteId!: number;
  deleteType: 'single' | 'batch' = 'single';

  // =========================
  // 篩選視窗控制與選項
  // =========================
  showFilterModal = false;

  statusOptions: DisplayStatus[] = ['已上架', '隱藏中', '已下架'];

  priorityOptions: DisasterDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  categoryOptions: NonNullable<DisasterDemand['category']>[] = ['食物', '衣物', '醫療', '嬰幼兒', '生活用品', '其他'];

  messageOptions = ['已回覆', '未回覆'];

  // 儲存當前選中的篩選條件
  selectedFilters = {
    status: [] as string[],
    priority: [] as string[],
    lowRemaining: false,
    category: [] as string[],
    messageStatus: [] as string[],
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDemands();
  }

  // 載入資料
  loadDemands() {
    this.demands = this.disasterDemandService.getDemands().map((item) => {
      let currentStatus: DisplayStatus = '已上架';

      if (item.status === '上架') currentStatus = '已上架';
      if (item.status === '隱藏') currentStatus = '隱藏中';
      if (item.status === '下架') currentStatus = '已下架';

      return {
        ...item,
        selected: false,
        status: item.status,
        displayStatus: currentStatus,
        remaining: item.remaining ?? item.amount ?? 0,
        category: item.category ?? '其他',
      };
    });

    this.applyFilters();
  }

  // 全選
  toggleAll() {
    this.filteredDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  // 判斷是否選取
  hasSelected() {
    return this.filteredDemands.some((item) => item.selected);
  }

  // 批次修改
  editSelected() {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');
      return;
    }

    localStorage.setItem('editDemands', JSON.stringify(selectedItems));
    this.router.navigate(['/agency/disaster-item-batch-edit']);
  }

  // =========================
  // 篩選功能邏輯
  // =========================

  openFilterModal() {
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  // 切換選取標籤 (多選切換)
  toggleFilter(key: 'status' | 'priority' | 'category' | 'messageStatus', value: string) {
    const index = this.selectedFilters[key].indexOf(value);
    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }
  }

  // 重置篩選條件（僅還原彈窗內按鈕狀態，不離開頁面）
  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }

  // 執行篩選並更新表格
  applyFilters() {
    this.filteredDemands = this.demands.filter((item) => {
      // 1. 依上架狀態
      if (this.selectedFilters.status.length > 0 && !this.selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }
      // 2. 依緊急優先度
      if (this.selectedFilters.priority.length > 0 && !this.selectedFilters.priority.includes(item.priority)) {
        return false;
      }
      // 3. 低剩餘項目 (設定剩餘數量 <= 5 為低剩餘)
      if (this.selectedFilters.lowRemaining && Number(item.remaining ?? 0) > 5) {
        return false;
      }
      // 4. 依類別
      if (this.selectedFilters.category.length > 0 && (!item.category || !this.selectedFilters.category.includes(item.category))) {
        return false;
      }
      // 5. 依留言/聯絡狀態
      if (this.selectedFilters.messageStatus.length > 0) {
        const hasMsg = (item.messageCount || 0) > 0;
        const wantsReplied = this.selectedFilters.messageStatus.includes('已回覆');
        const wantsUnreplied = this.selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsUnreplied && !hasMsg) return false;
        if (wantsUnreplied && !wantsReplied && hasMsg) return false;
      }

      return true;
    });

    this.closeFilterModal();
  }

  // =========================
  // 刪除控制邏輯
  // =========================

  openDeleteModal(id: number) {
    this.deleteId = id;
    this.deleteType = 'single';
    this.showDeleteModal = true;
  }

  openBatchDeleteModal() {
    this.deleteType = 'batch';
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.deleteType === 'single') {
      this.disasterDemandService.deleteDemand(this.deleteId);
    } else {
      const ids = this.filteredDemands.filter((item) => item.selected && item.id !== undefined).map((item) => item.id as number);

      ids.forEach((id) => {
        this.disasterDemandService.deleteDemand(id);
      });

      this.selectAll = false;
    }

    this.loadDemands();
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  changeStatus(
    item: DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
    }
  ) {
    let status: DisasterStatus;

    switch (item.displayStatus) {
      case '已上架':
        status = '上架';
        break;

      case '隱藏中':
        status = '隱藏';
        break;

      case '已下架':
        status = '下架';
        break;

      default:
        status = '上架';
    }

    item.status = status;

    this.disasterDemandService.updateDemand(item);
  }
}
