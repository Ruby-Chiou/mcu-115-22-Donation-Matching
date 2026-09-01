import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyDemandService } from '../../../../core/services/daily-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-daily-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent],
  templateUrl: './daily-form.component.html',
  styleUrls: [
    './daily-form-A.component.scss',
    './daily-form-B.component.scss',
    './daily-form-C.component.scss',
    './daily-form-D.component.scss',
  ],
})
export class DailyFormComponent implements OnInit, AfterViewInit {
  isEditMode = false;
  submitted = false;
  fromDetail = false;
  hasServiceTarget = true;

  // 圖片
  imageFiles: File[] = [];

  // 圖片預覽
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  // 類別下拉選單
  categoryDropdownOpen = false;

  categoryOptions: NonNullable<DailyDemand['category']>[] = [
    '食品與飲用水',
    '衣物與保暖用品',
    '醫療與照護用品',
    '清潔與衛生用品',
    '嬰幼兒用品',
    '長者與身心障礙用品',
    '女性生理用品',
    '寵物與動物用品',
    '防災與照明用品',
    '通訊與求救用品',
    '生活與炊事用品',
    '居住安置與修繕用品',
    '其他',
  ];

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  demand: DailyDemand = {
    serialNo: 0,
    item: '',
    amount: null,
    unit: '',
    amountDescription: '',
    reason: '',
    description: '',
    contactTimeWeekday: false,
    contactTimeWeekend: false,
    contactTimeMorning: false,
    contactTimeAfternoon: false,
    contactTimeEvening: false,

    // 聯絡時間：是否分開設定平日、假日
    contactTimeSeparate: false,

    // 平日時段
    contactTimeWeekdayMorning: false,
    contactTimeWeekdayAfternoon: false,
    contactTimeWeekdayEvening: false,

    // 假日時段
    contactTimeWeekendMorning: false,
    contactTimeWeekendAfternoon: false,
    contactTimeWeekendEvening: false,

    //服務對象
    serviceTargets: {
      老人: false,
      嬰幼兒: false,
      孩童: false,
      青少年: false,
      身障: false,
      貧困: false,
      重症照護: false,
      動物: false,
      無家者: false,
    },

    customServiceTargets: [''],

    // 資料庫使用：合併後的需求對象
    serviceTargetDescription: '',

    // 接受物資狀態
    conditions: {
      全新: '',
      二手: '',
      有擦痕: '',
      過期: '',
      毀損: '',
    },

    customConditions: [''],
    // 資料庫使用：合併後的物資需求狀態
    conditionDescription: '',

    priority: '普通',
    status: '隱藏',
    receiveMethod: {
      寄送: false,
      面交: false,
    },
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
    private cdr: ChangeDetectorRef
  ) {}

  // 點擊類別下拉選單以外的地方時關閉
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.custom-select')) {
      this.categoryDropdownOpen = false;
    }
  }

  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(category: NonNullable<DailyDemand['category']>) {
    this.demand.category = category;
    this.categoryDropdownOpen = false;
  }

  ngOnInit() {
    const serialNo = Number(this.route.snapshot.paramMap.get('serialNo'));

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    // 編輯模式
    if (serialNo) {
      this.isEditMode = true;

      const data = this.dailyDemandService.getDemands().find((item) => item.serialNo === serialNo);

      if (data) {
        this.demand = {
          ...data,
          status: data.status ?? '上架',
          remaining: data.remaining ?? null,

          receiveMethod:
            typeof data.receiveMethod === 'object'
              ? { ...data.receiveMethod }
              : {
                  寄送: data.receiveMethod === '寄送',
                  面交: data.receiveMethod === '面交',
                },

          recipient: data.recipient ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',

          image: [...(data.image ?? [])],
          imageFileNames: [...(data.imageFileNames ?? [])],

          contactTimeWeekday: data.contactTimeWeekday ?? false,
          contactTimeWeekend: data.contactTimeWeekend ?? false,
          contactTimeMorning: data.contactTimeMorning ?? false,
          contactTimeAfternoon: data.contactTimeAfternoon ?? false,
          contactTimeEvening: data.contactTimeEvening ?? false,

          contactTimeSeparate: data.contactTimeSeparate ?? false,

          contactTimeWeekdayMorning: data.contactTimeWeekdayMorning ?? false,
          contactTimeWeekdayAfternoon: data.contactTimeWeekdayAfternoon ?? false,
          contactTimeWeekdayEvening: data.contactTimeWeekdayEvening ?? false,

          contactTimeWeekendMorning: data.contactTimeWeekendMorning ?? false,
          contactTimeWeekendAfternoon: data.contactTimeWeekendAfternoon ?? false,
          contactTimeWeekendEvening: data.contactTimeWeekendEvening ?? false,

          serviceTargetDescription: data.serviceTargetDescription ?? '',
          conditionDescription: data.conditionDescription ?? '',

          serviceTargets: data.serviceTargets
            ? { ...data.serviceTargets }
            : {
                老人: false,
                嬰幼兒: false,
                孩童: false,
                青少年: false,
                身障: false,
                貧困: false,
                重症照護: false,
                動物: false,
                無家者: false,
              },

          customServiceTargets: data.customServiceTargets?.length ? [...data.customServiceTargets] : [''],

          conditions: data.conditions
            ? { ...data.conditions }
            : {
                全新: '',
                二手: '',
                有擦痕: '',
                過期: '',
                毀損: '',
              },

          customConditions: data.customConditions?.length ? [...data.customConditions] : [''],
        };

        // 載入原本已儲存的圖片
        this.imageFiles = [];

        Promise.all(
          (data.image ?? []).map((image, index) => {
            const fileName = data.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

            return this.base64ToFile(image, fileName);
          })
        ).then((files) => {
          this.imageFiles = files;
          this.cdr.detectChanges();
        });
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

  async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();

    return new File([blob], fileName, { type: blob.type });
  }

  get hasReceiveMethod(): boolean {
    return this.demand.receiveMethod['寄送'] || this.demand.receiveMethod['面交'];
  }

  save() {
    this.submitted = true;

    this.hasServiceTarget =
      Object.values(this.demand.serviceTargets).some((value: boolean) => value) ||
      this.demand.customServiceTargets.some((target) => target.trim());

    const hasReceiveMethod = this.demand.receiveMethod.寄送 || this.demand.receiveMethod.面交;

    const invalidReceiveInfo = !hasReceiveMethod || !this.demand.recipient || !this.demand.address;

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
      } else if (!hasReceiveMethod) {
        document.querySelector('.receive-method-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.recipient) {
        document.querySelector('.receive-info-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.address) {
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
      const originalStatus = this.dailyDemandService.getDemands().find((item) => item.serialNo === this.demand.serialNo)?.status;

      const originalPublishedAt = this.demand.publishedAt;
      const now = new Date();

      if (this.demand.status === '上架') {
        if (originalStatus !== '上架') {
          this.demand.publishedAt = now.toISOString();

          if (!this.demand.createdAt) {
            this.demand.createdAt = now.toISOString();
          }
        } else if (originalPublishedAt) {
          this.demand.publishedAt = originalPublishedAt;
        }

        if (this.demand.publishedAt) {
          this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(this.demand.publishedAt), this.demand.priority);
        }
      } else if (this.demand.status === '隱藏') {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
      } else if (this.demand.status === '下架') {
        this.demand.expectedOffShelfAt = now.toISOString();
      }

      this.dailyDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/daily-detail', this.demand.serialNo]);
      } else {
        this.router.navigate(['/agency/daily']);
      }
    } else {
      // 按下「發布需求」的時間
      const createdDate = new Date();

      // 創建日期：記錄按下發布的日期
      this.demand.createdAt = createdDate.toISOString();

      // 如果新增時選擇「上架」
      if (this.demand.status === '上架') {
        // 上架日期 = 發布日期
        this.demand.publishedAt = createdDate.toISOString();

        // 計算預計下架日期
        this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, this.demand.priority);
      } else {
        // 隱藏：尚未上架
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
      }

      this.dailyDemandService.addDemand(this.demand);

      this.router.navigate(['/agency/daily']);
    }
  }

  // 整合需求對象：固定需求對象 + 其他自訂需求對象
  buildServiceTargetDescription(): string {
    const targets: string[] = [];

    Object.entries(this.demand.serviceTargets).forEach(([key, value]) => {
      if (value) {
        targets.push(`${key}✓`);
      }
    });

    this.demand.customServiceTargets.forEach((target) => {
      const value = target.trim();

      if (value) {
        targets.push(value);
      }
    });

    return targets.join('、');
  }

  // 整合物資需求狀態：接受物資狀態 + 其他自訂物資狀態
  buildConditionDescription(): string {
    const conditions = [
      { name: '全新', value: this.demand.conditions.全新 },
      { name: '二手', value: this.demand.conditions.二手 },
      { name: '有擦痕', value: this.demand.conditions.有擦痕 },
      { name: '過期', value: this.demand.conditions.過期 },
      { name: '毀損', value: this.demand.conditions.毀損 },
    ];

    const result: string[] = [];

    conditions.forEach((condition) => {
      if (condition.value === '接受') {
        result.push(`${condition.name}✓`);
      } else if (condition.value === '不接受') {
        result.push(`${condition.name}✗`);
      }
    });

    this.demand.customConditions.forEach((condition) => {
      const value = condition.trim();

      if (value) {
        result.push(value);
      }
    });

    return result.join('、');
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

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 60);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;
    }

    return offShelfDate.toISOString();
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

    // 建立資料庫使用的合併欄位
    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();
    this.demand.conditionDescription = this.buildConditionDescription();
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
    let value = input.value.replace(/[^0-9]/g, '');

    // 最多 10 位，超過的部分直接截掉
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // 同步回輸入框
    input.value = value;

    const numberValue = value ? Number(value) : null;

    if (field === 'amount') {
      this.demand.amount = numberValue;

      // 新增時，剩餘需求預設等於需求數量
      if (!this.isEditMode) {
        this.demand.remaining = numberValue;
      }
    }

    if (field === 'remaining') {
      // 不能超過需求數量
      if (numberValue !== null && this.demand.amount !== null && numberValue > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
        input.value = this.demand.amount.toString();
      } else {
        this.demand.remaining = numberValue;
      }
    }
  }

  limitTextLength(field: 'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note', maxLength: number) {
    const value = this.demand[field];

    if (typeof value !== 'string') {
      return;
    }

    // 超過最大長度時，直接截斷並同步回輸入框
    if (value.length > maxLength) {
      this.demand[field] = value.substring(0, maxLength);
    }
  }

  limitSimpleTextLength(field: 'unit' | 'recipient' | 'address' | 'phone', maxLength: number) {
    const value = this.demand[field];

    if (typeof value === 'string' && value.length > maxLength) {
      this.demand[field] = value.substring(0, maxLength);
    }
  }

  limitCustomArrayTextLength(field: 'customServiceTargets' | 'customConditions', index: number, maxLength: number) {
    const value = this.demand[field][index];

    if (typeof value === 'string' && value.length > maxLength) {
      this.demand[field][index] = value.substring(0, maxLength);
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 最多 5 張
    if (this.imageFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    // 加入圖片清單
    this.imageFiles.push(file);

    // 讀取圖片
    const reader = new FileReader();

    reader.onload = () => {
      if (!this.demand.image) {
        this.demand.image = [];
      }

      if (!this.demand.imageFileNames) {
        this.demand.imageFileNames = [];
      }

      this.demand.image.push(reader.result as string);
      this.demand.imageFileNames.push(file.name);
    };

    reader.readAsDataURL(file);

    // 清空 input
    input.value = '';
  }

  removeImage(index: number) {
    this.imageFiles.splice(index, 1);

    if (this.demand.image) {
      this.demand.image.splice(index, 1);
    }

    if (this.demand.imageFileNames) {
      this.demand.imageFileNames.splice(index, 1);
    }
  }

  openImagePreview(image: string, imageName: string): void {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
