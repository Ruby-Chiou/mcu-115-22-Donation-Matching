import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-daily-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './daily-form.component.html',
  styleUrls: ['./daily-form-A.component.scss', './daily-form-B.component.scss'],
})
export class DailyFormComponent implements OnInit, AfterViewInit {
  isEditMode = false;
  submitted = false;
  fromDetail = false;
  hasServiceTarget = true;

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  demand: DailyDemand = {
    id: 0,
    item: '',
    amount: null,
    unit: '',
    amountDescription: '',
    reason: '',
    description: '',

    //服務對象
    serviceTargets: {
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

    customServiceTargets: [''],

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

    // 接收方式
    receiveMethod: '寄送',
    recipient: '',
    address: '',
    phone: '',

    note: '',
    brand: '',
    category: '',
  };

  constructor(
    private dailyDemandService: DailyDemandService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // 👈 注入這行
  ) {}

  ngOnInit() {
    // 1. 嘗試從路徑參數抓（例如 /agency/daily-edit/5）
    let id = Number(this.route.snapshot.paramMap.get('id'));

    // 2. 如果路徑抓不到，嘗試從 Query Parameters 抓（例如 /agency/daily-edit?id=5）
    if (!id || isNaN(id)) {
      const queryId = this.route.snapshot.queryParamMap.get('id');
      if (queryId) id = Number(queryId);
    }

    // 3. 如果還是抓不到，嘗試從歷史記錄 state 抓
    if (!id || isNaN(id)) {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state) {
        id = Number((navigation.extras.state as any)['id']);
      }
    }

    console.log('🔗 最終抓到的編輯 ID 是：', id);

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    // 編輯模式
    if (id && !isNaN(id) && id > 0) {
      this.isEditMode = true;

      this.dailyDemandService.getDemandByIdAsync(id).then((data) => {
        console.log('📦 成功從 Service 撈到要編輯的單筆資料：', data);

        if (data) {
          this.demand = {
            ...data,
            status: data.status ?? '上架',
            remaining: data.remaining ?? null,

            // 修正 1：確保 receiveMethod 是字串而非陣列
            receiveMethod: Array.isArray(data.receiveMethod) ? (data.receiveMethod[0] ?? '寄送') : (data.receiveMethod ?? '寄送'),

            recipient: data.recipient ?? '',

            // 修正 2：把陣列轉成前端 Checkbox 要的物件格式
            serviceTargets: Array.isArray(data.serviceTargets)
              ? {
                  老人: data.serviceTargets.includes('老人'),
                  嬰幼兒: data.serviceTargets.includes('嬰幼兒'),
                  孩童: data.serviceTargets.includes('孩童'),
                  青少年: data.serviceTargets.includes('青少年'),
                  身障: data.serviceTargets.includes('身障'),
                  貧困: data.serviceTargets.includes('貧困'),
                  重症照護: data.serviceTargets.includes('重症照護'),
                  寵物: data.serviceTargets.includes('寵物'),
                  流浪: data.serviceTargets.includes('流浪'),
                  野生: data.serviceTargets.includes('野生'),
                }
              : (data.serviceTargets ?? {
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
                }),

            customServiceTargets: data.customServiceTargets?.length ? data.customServiceTargets : [''],

            // 修正 3：確保 conditions 是物件
            conditions: (Array.isArray(data.conditions)
              ? {
                  全新: data.conditions.includes('全新') ? '全新' : '',
                  二手: data.conditions.includes('二手') ? '二手' : '',
                  有擦痕: data.conditions.includes('有擦痕') ? '有擦痕' : '',
                  過期: data.conditions.includes('過期') ? '過期' : '',
                  毀損: data.conditions.includes('毀損') ? '毀損' : '',
                }
              : (data.conditions ?? { 全新: '', 二手: '', 有擦痕: '', 過期: '', 毀損: '' })) as any,

            customConditions: data.customConditions?.length ? data.customConditions : [''],

            // 修正 4：category 統一對應
            category: data.category ?? '其他',
          };

          this.cdr.detectChanges();
        } else {
          console.warn('⚠️ 找不到對應 ID 的資料！');
        }
      });
    } else {
      console.log('✨ 目前為【新增模式】，沒有偵測到有效 ID');
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

    this.hasServiceTarget =
      Object.values(this.demand.serviceTargets).some((value: boolean) => value) ||
      this.demand.customServiceTargets.some((target) => target.trim());

    const invalidReceiveInfo =
      !this.demand.receiveMethod ||
      (this.demand.receiveMethod === '寄送' && (!this.demand.recipient || !this.demand.address)) ||
      (this.demand.receiveMethod === '面交' && !this.demand.address);

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.unit ||
      !this.demand.category ||
      !this.demand.reason ||
      !this.demand.description ||
      invalidReceiveInfo ||
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
      } else if (!this.demand.receiveMethod) {
        document.querySelector('.receive-method-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (this.demand.receiveMethod === '寄送' && !this.demand.recipient) {
        document.querySelector('.receive-info-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (this.demand.receiveMethod === '寄送' && !this.demand.address) {
        document.querySelector('.receive-info-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (this.demand.receiveMethod === '面交' && !this.demand.address) {
        document.querySelector('.receive-info-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      return;
    }

    if (!this.hasServiceTarget) {
      this.scrollToServiceTarget();
      return;
    }

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

    if (this.isEditMode) {
      // 上架 / 下架 都需要發布時間
      if ((this.demand.status === '上架' || this.demand.status === '下架') && !this.demand.createdAt) {
        this.demand.createdAt = new Date().toISOString();
      }

      // 隱藏代表尚未發布，清除時間
      if (this.demand.status === '隱藏') {
        this.demand.createdAt = undefined;
      }

      this.dailyDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/daily-detail', this.demand.id]);
      } else {
        this.router.navigate(['/agency/daily']);
      }
    } else {
      // 新增時只有上架才有發布時間
      if (this.demand.status === '上架') {
        this.demand.createdAt = new Date().toISOString();
      } else {
        this.demand.createdAt = undefined;
      }

      this.dailyDemandService.addDemand(this.demand);

      this.router.navigate(['/agency/daily']);
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
  addCustomServiceTarget() {
    if (this.demand.customServiceTargets.length < 5) {
      this.demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(index: number) {
    this.demand.customServiceTargets.splice(index, 1);

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }
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

  toggleCondition(key: keyof DailyDemand['conditions']) {
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

  onReceiveMethodChange(method: '寄送' | '面交') {
    if (method === '寄送') {
      this.demand.address = '';
    }

    if (method === '面交') {
      this.demand.recipient = '';
      this.demand.address = '';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
