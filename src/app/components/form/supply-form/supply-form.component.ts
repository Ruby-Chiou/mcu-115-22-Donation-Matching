import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DisasterDemand } from '../../../models/agency/demand';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './supply-form.component.html',
  styleUrls: ['./supply-form-A.component.scss', './supply-form-B.component.scss'],
})
export class SupplyFormComponent implements OnInit, AfterViewInit {
  isEditMode = false;
  submitted = false;

  fromDetail = false;

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  demand: DisasterDemand = {
    id: 0,
    item: '',
    amount: null,
    unit: '',
    amountDescription: '',
    reason: '',
    description: '',

    // 接受物資狀態
    conditions: {
      全新: '',
      二手: '',
      有擦痕: '',
      過期: '',
      毀損: '',
    },

    customConditions: [''],

    priority: '普通',
    status: '上架',
    address: '',
    phone: '',
    note: '',
    brand: '',
    category: '',
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    // 編輯模式
    if (id) {
      this.isEditMode = true;

      const data = this.disasterDemandService.getDemands().find((item) => item.id === id);

      if (data) {
        this.demand = {
          ...data,
          status: data.status ?? '上架',
          remaining: data.remaining ?? null,

          conditions: data.conditions ?? {
            全新: '',
            二手: '',
            有擦痕: '',
            過期: '',
            毀損: '',
          },

          customConditions: data.customConditions?.length ? data.customConditions : [''],
        };
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }, 0);
  }

  save() {
    this.submitted = true;

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.unit ||
      !this.demand.category ||
      !this.demand.reason ||
      !this.demand.description ||
      !this.demand.address ||
      !this.demand.phone ||
      (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined))
    ) {
      if (!this.demand.item) {
        this.itemInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.amount) {
        this.amountInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.unit) {
        this.unitInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined)) {
        this.remainingInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.category) {
        this.categoryInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.reason) {
        this.reasonInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.description) {
        this.descriptionInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      return;
    }

    // 清除空白的自訂欄位
    this.demand.customConditions = this.demand.customConditions.filter((item) => item.trim() !== '');

    // 保留至少一個輸入框
    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    if (this.isEditMode) {
      // 上架 / 下架 都需要發布時間
      if ((this.demand.status === '上架' || this.demand.status === '下架') && !this.demand.createdAt) {
        this.demand.createdAt = new Date().toISOString();
      }

      // 隱藏代表尚未發布，清除時間
      if (this.demand.status === '隱藏') {
        this.demand.createdAt = undefined;
      }

      this.disasterDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/supply-detail', this.demand.id]);
      } else {
        this.router.navigate(['/agency/disaster']);
      }
    } else {
      // 新增時只有上架才有發布時間
      if (this.demand.status === '上架') {
        this.demand.createdAt = new Date().toISOString();
      } else {
        this.demand.createdAt = undefined;
      }

      this.disasterDemandService.addDemand(this.demand);

      this.router.navigate(['/agency/disaster']);
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

  toggleCondition(key: keyof DisasterDemand['conditions']) {
    const current = this.demand.conditions[key];

    if (current === '') {
      this.demand.conditions[key] = '接受';
    } else if (current === '接受') {
      this.demand.conditions[key] = '不接受';
    } else {
      this.demand.conditions[key] = '';
    }
  }

  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  onRemainingChange() {
    if (this.demand.remaining !== null && this.demand.remaining !== undefined) {
      this.demand.remaining = Number(this.demand.remaining);

      // 剩餘需求不可超過需求數量
      if (this.demand.amount !== null && this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  limitNumberLength(event: Event, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    // 只允許數字
    input.value = input.value.replace(/[^0-9]/g, '');

    // 最多10位
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      this.demand.amount = value;

      // 新增時，剩餘需求預設等於需求數量
      if (!this.isEditMode) {
        this.demand.remaining = value;
      }
    }

    if (field === 'remaining') {
      // 不能超過需求數量
      if (value !== null && this.demand.amount !== null && value > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
        input.value = this.demand.amount.toString();
      } else {
        this.demand.remaining = value;
      }
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
