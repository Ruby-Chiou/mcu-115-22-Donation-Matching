import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-batch-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './agency-disaster-batch-edit.component.html',
  styleUrl: './agency-disaster-batch-edit.component.scss',
})
export class AgencyDisasterBatchEditComponent implements OnInit {
  editDemands: any[] = [];

  // 物品完好度選項

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

        customCondition: item.customCondition || '',

        unit: item.unit || '',

        amountDescription: item.amountDescription || '',

        status: item.status || '上架',
      }));
    }

    console.log('批次修改資料:', this.editDemands);
  }

  saveAll() {
    // =========================
    // 清除舊錯誤 + 檢查必填
    // =========================

    this.editDemands.forEach((item) => {
      item.itemError = false;

      item.amountError = false;

      item.reasonError = false;

      item.descriptionError = false;

      item.addressError = false;

      item.phoneError = false;

      if (!item.item) {
        item.itemError = true;
      }

      if (item.amount === '') {
        item.amountError = true;
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
      (item) => item.itemError || item.amountError || item.reasonError || item.descriptionError || item.addressError || item.phoneError
    );

    if (invalid) {
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.invalid') as HTMLElement | null;

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
    // 全部通過，更新資料
    // =========================

    this.editDemands.forEach((item) => {
      this.service.updateDemand(item);
    });

    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/disaster-post']);
  }

  cancel() {
    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/disaster-post']);
  }
}
