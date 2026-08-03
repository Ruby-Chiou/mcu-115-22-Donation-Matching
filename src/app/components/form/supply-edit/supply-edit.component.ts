import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand, DisasterConditions } from '../../../models/user/agency';

@Component({
  selector: 'app-supply-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './supply-edit.component.html',
  styleUrl: './supply-edit.component.scss',
})
export class SupplyEditComponent implements OnInit {
  submitted = false;

  hasServiceTarget = true;

  @ViewChild('itemInput') itemInput!: ElementRef;

  demand: DisasterDemand = {} as DisasterDemand;

  constructor(
    private route: ActivatedRoute,

    private service: DisasterDemandService,

    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const data = this.service.getDemands().find((item) => item.id === id);

    if (data) {
      this.demand = {
        ...data,

        conditions: data.conditions || {
          全新: '',

          二手: '',

          有擦痕: '',

          過期: '',

          毀損: '',
        },

        customConditions: data.customConditions?.length ? data.customConditions : [''],

        unit: data.unit || '',

        amountDescription: data.amountDescription || '',

        status: data.status || '上架',

        remaining: data.remaining ?? data.amount ?? 0,

        brand: data.brand || '',

        category: data.category,

        serviceTargets: data.serviceTargets || {
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

        customServiceTargets: data.customServiceTargets?.length ? data.customServiceTargets : [''],
      };
    }
  }

  // 限制剩餘需求最高只能填到需求數量

  onRemainingChange() {
    if (this.demand.amount !== null && this.demand.remaining !== undefined) {
      if (this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  save() {
    this.submitted = true;

    // 1. 檢查服務對象必填（至少需要一項勾選或輸入自訂服務對象）

    this.hasServiceTarget =
      Object.values(this.demand.serviceTargets || {}).some((value: any) => value) ||
      this.demand.customServiceTargets?.some((target: string) => target.trim());

    // 2. 剩餘需求不可小於 0

    if (this.demand.remaining !== undefined && this.demand.remaining < 0) {
      alert('剩餘需求不可小於 0');

      return;
    }

    // 3. 基本必填與數值驗證（含需求數量、單位、剩餘需求）

    const isAmountInvalid = !this.demand.amount || isNaN(Number(this.demand.amount));

    const isRemainingInvalid = this.demand.remaining === undefined || this.demand.remaining === null || isNaN(this.demand.remaining);

    if (
      !this.demand.item ||
      isAmountInvalid ||
      !this.demand.unit ||
      isRemainingInvalid ||
      !this.demand.reason ||
      !this.demand.description ||
      !this.demand.address ||
      !this.demand.phone
    ) {
      this.itemInput.nativeElement.scrollIntoView({
        behavior: 'smooth',

        block: 'center',
      });

      return;
    }

    // 4. 服務對象未填驗證與獨立滾動

    if (!this.hasServiceTarget) {
      this.scrollToServiceTarget();

      return;
    }

    // 確保物資狀態物件齊全

    if (!this.demand.conditions) {
      this.demand.conditions = {
        全新: '',
        二手: '',
        有擦痕: '',
        過期: '',
        毀損: '',
      } as DisasterConditions;
    }
    // 自動重新判斷需求分類
    this.demand.category = this.service.getCategory(this.demand.item);

    // 清除空白的自訂欄位
    this.demand.customConditions = this.demand.customConditions.filter((item) => item.trim() !== '');

    this.demand.customServiceTargets = this.demand.customServiceTargets.filter((item) => item.trim() !== '');

    // 保留至少一個輸入框
    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }

    // 更新資料並返回頁面
    this.service.updateDemand(this.demand);

    this.router.navigate(['/agency/disaster']);
  }

  isNaN(val: any): boolean {
    return isNaN(Number(val));
  }

  scrollToServiceTarget() {
    const element = document.querySelector('.service-target-area');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',

        block: 'center',
      });
    }
  }

  addCustomCondition() {
    if (this.demand.customConditions.length < 5) {
      this.demand.customConditions.push('');
    }
  }

  removeCustomCondition(index: number) {
    this.demand.customConditions.splice(index, 1);

    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }
  }

  removeCustomServiceTarget(index: number) {
    this.demand.customServiceTargets.splice(index, 1);

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }
  }

  addCustomServiceTarget() {
    if (this.demand.customServiceTargets.length < 5) {
      this.demand.customServiceTargets.push('');
    }
  }
  trackByIndex(index: number) {
    return index;
  }
}
