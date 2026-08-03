import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { EditableDisasterDemand } from '../../../models/user/agency';

@Component({
  selector: 'app-supply-batch-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './supply-batch-edit.component.html',
  styleUrl: './supply-batch-edit.component.scss',
})
export class SupplyBatchEditComponent implements OnInit {
  editDemands: EditableDisasterDemand[] = [];

  constructor(
    private service: DisasterDemandService,
    private router: Router
  ) {}

  ngOnInit() {
    const data = localStorage.getItem('editDemands');

    if (data) {
      this.editDemands = JSON.parse(data).map((item: any) => ({
        ...item,

        conditions: item.conditions || {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        },

        customConditions: item.customConditions?.length ? item.customConditions : [''],

        unit: item.unit || '',
        amountDescription: item.amountDescription || '',
        status: item.status || '上架',
        remaining: item.remaining ?? item.amount,
        brand: item.brand || '',
        category: item.category || '',

        // 服務對象初始化（相容舊資料）
        serviceTargets: item.serviceTargets || {
          老人: false,
          嬰幼兒: false,
          孩童: false,
          青少年: false,
          身障: false,
          貧困: false,
          重症照護: false,
          寵物: false,
          流浪: false,
          野生: false,
        },

        customServiceTargets: item.customServiceTargets?.length ? item.customServiceTargets : [''],
      }));
    }

    console.log('批次修改資料:', this.editDemands);
  }

  // 限制剩餘需求最高只能填到需求數量
  onRemainingChange(demand: any) {
    if (demand.amount !== undefined && demand.amount !== null && demand.amount !== '') {
      const maxAmount = Number(demand.amount);
      const currentRemaining = Number(demand.remaining);

      if (!isNaN(maxAmount) && !isNaN(currentRemaining)) {
        if (currentRemaining > maxAmount) {
          demand.remaining = maxAmount;
        }
      }
    }
  }

  saveAll() {
    // =========================
    // 清除舊錯誤 + 檢查必填
    // =========================
    this.editDemands.forEach((item) => {
      item.itemError = false;
      item.amountError = false;
      item.unitError = false;
      item.reasonError = false;
      item.descriptionError = false;
      item.addressError = false;
      item.phoneError = false;
      item.remainingError = false;
      item.serviceTargetError = false;

      // 服務對象檢查
      const hasServiceTarget =
        Object.values(item.serviceTargets || {}).some((value: any) => value) ||
        item.customServiceTargets?.some((target: string) => target.trim());

      if (!hasServiceTarget) {
        item.serviceTargetError = true;
      }

      if (!item.item) {
        item.itemError = true;
      }

      if (!item.amount || isNaN(Number(item.amount))) {
        item.amountError = true;
      }

      if (!item.unit || !item.unit.trim()) {
        item.unitError = true;
      }
      if (item.remaining === undefined || item.remaining === null) {
        item.remainingError = true;
      }

      if (Number(item.remaining) < 0) {
        item.remainingError = true;
      }

      if (!item.reason) {
        item.reasonError = true;
      }

      if (!item.description) {
        item.descriptionError = true;
      }

      if (!item.address) {
        item.addressError = true;
      }

      if (!item.phone) {
        item.phoneError = true;
      }
    });

    // =========================
    // 判斷是否有錯誤
    // =========================
    const invalid = this.editDemands.some(
      (item) =>
        item.itemError ||
        item.amountError ||
        item.unitError ||
        item.reasonError ||
        item.descriptionError ||
        item.addressError ||
        item.phoneError ||
        item.remainingError ||
        item.serviceTargetError
    );

    if (invalid) {
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.invalid, .invalid-box') as HTMLElement | null;

        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          firstErrorElement.focus();
        }
      }, 0);

      return;
    }

    this.editDemands.forEach((item) => {
      if (!item.conditions) {
        item.conditions = {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        };
      }
    });

    // =========================
    // 自動重新判斷需求分類
    // =========================
    this.editDemands.forEach((item) => {
      item.category = this.service.getCategory(item.item);
    });

    // 清除空白自訂欄位
    this.editDemands.forEach((item) => {
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

      item.customServiceTargets = item.customServiceTargets.filter((target) => target.trim() !== '');

      // 至少保留一個輸入框
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }

      if (item.customServiceTargets.length === 0) {
        item.customServiceTargets.push('');
      }

      this.service.updateDemand(item);
    });

    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/disaster']);
  }

  // 其他物品狀態動態增減
  addCustomCondition(demand: any) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: any, index: number) {
    if (demand.customConditions.length > 1) {
      demand.customConditions.splice(index, 1);
    }
  }

  // 其他服務對象動態增減
  addCustomServiceTarget(demand: any) {
    if (demand.customServiceTargets.length < 5) {
      demand.customServiceTargets.push('');
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  removeCustomServiceTarget(demand: any, index: number) {
    if (demand.customServiceTargets.length > 1) {
      demand.customServiceTargets.splice(index, 1);
    }
  }

  cancel() {
    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/disaster']);
  }
}
