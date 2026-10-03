import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

export class DailyFormLogicBase {
  protected readonly dailyDemandService: DailyDemandService;
  protected readonly router: Router;
  protected readonly route: ActivatedRoute;
  protected readonly httpClient: HttpClient;

  isEditMode = false;
  submitted = false;
  fromDetail = false;
  hasServiceTarget = true;

  protected originalStatus: DailyDemand['status'] = '隱藏';
  protected originalOffShelfReason: DailyDemand['offShelfReason'] | undefined;
  protected pendingStatus: DailyDemand['status'] | undefined;

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  serviceTargetOptions: string[] = ['老人', '嬰幼兒', '孩童', '青少年', '身障', '貧困', '重症照護', '動物', '無家者'];

  imageFiles: File[] = [];
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';
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
    contactTimeSeparate: false,
    contactTimeWeekdayMorning: false,
    contactTimeWeekdayAfternoon: false,
    contactTimeWeekdayEvening: false,
    contactTimeWeekendMorning: false,
    contactTimeWeekendAfternoon: false,
    contactTimeWeekendEvening: false,
    serviceTargets: [],
    customServiceTargets: [''],
    serviceTargetDescription: '',
    conditions: {
      全新: '',
      二手: '',
      有擦痕: '',
      過期: '',
      毀損: '',
    },
    customConditions: [''],
    conditionDescription: '',
    priority: '普通',
    status: '隱藏',
    receiveMethod: {
      寄送: false,
      面交: false,
    },
    recipient: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    phone: '',
    note: '',
    brand: '',
    category: '',
  };

  constructor(dailyDemandService: DailyDemandService, router: Router, route: ActivatedRoute, httpClient: HttpClient) {
    this.dailyDemandService = dailyDemandService;
    this.router = router;
    this.route = route;
    this.httpClient = httpClient;
  }

  get isManualOffShelf(): boolean {
    return this.isEditMode && this.demand.status === '下架' && this.demand.offShelfReason === 'manual';
  }

  get hasReceiveMethod(): boolean {
    return this.demand.receiveMethod['寄送'] || this.demand.receiveMethod['面交'];
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.custom-select')) {
      this.categoryDropdownOpen = false;
    }
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(category: NonNullable<DailyDemand['category']>): void {
    this.demand.category = category;
    this.categoryDropdownOpen = false;
  }

  async base64ToFile(imageSource: string, fileName: string): Promise<File | null> {
    if (!imageSource.startsWith('data:')) {
      console.warn('[DailyFormLogic] 外部圖片不轉換為 File，保留原網址：', imageSource);

      return null;
    }

    const response = await fetch(imageSource);

    if (!response.ok) {
      throw new Error(`圖片讀取失敗：${response.status}`);
    }

    const blob = await response.blob();

    return new File([blob], fileName, {
      type: blob.type || 'image/*',
    });
  }

  isServiceTargetSelected(target: string): boolean {
    return this.demand.serviceTargets.includes(target);
  }

  toggleServiceTarget(target: string): void {
    const index = this.demand.serviceTargets.indexOf(target);

    if (index === -1) {
      this.demand.serviceTargets.push(target);
    } else {
      this.demand.serviceTargets.splice(index, 1);
    }

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();
  }

  buildServiceTargetDescription(): string {
    const targets: string[] = [];

    this.demand.serviceTargets.forEach((target) => {
      if (target.trim()) {
        targets.push(`${target}✓`);
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

  buildConditionDescription(): string {
    const conditions = [
      {
        name: '全新',
        value: this.demand.conditions.全新,
      },
      {
        name: '二手',
        value: this.demand.conditions.二手,
      },
      {
        name: '有擦痕',
        value: this.demand.conditions.有擦痕,
      },
      {
        name: '過期',
        value: this.demand.conditions.過期,
      },
      {
        name: '毀損',
        value: this.demand.conditions.毀損,
      },
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

  addCustomCondition(): void {
    if (this.demand.customConditions.length < 5) {
      this.demand.customConditions.push('');
    }
  }

  removeCustomCondition(index: number): void {
    this.demand.customConditions.splice(index, 1);

    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();
  }

  addCustomServiceTarget(): void {
    if (this.demand.customServiceTargets.length < 5) {
      this.demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(index: number): void {
    this.demand.customServiceTargets.splice(index, 1);

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();
  }

  scrollToServiceTarget(): void {
    const element = document.querySelector('.service-target-area');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  toggleCondition(key: keyof DailyDemand['conditions']): void {
    const current = this.demand.conditions[key];

    if (current === '') {
      this.demand.conditions[key] = '接受';
    } else if (current === '接受') {
      this.demand.conditions[key] = '不接受';
    } else {
      this.demand.conditions[key] = '';
    }
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  onRemainingChange(): void {
    if (this.demand.remaining !== null && this.demand.remaining !== undefined) {
      this.demand.remaining = Number(this.demand.remaining);

      if (this.demand.amount !== null && this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  limitNumberLength(event: Event, field: 'amount' | 'remaining'): void {
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/[^0-9]/g, '');

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    input.value = value;

    const numberValue = value ? Number(value) : null;

    if (field === 'amount') {
      this.demand.amount = numberValue;

      if (!this.isEditMode) {
        this.demand.remaining = numberValue;
      }
    }

    if (field === 'remaining') {
      if (numberValue !== null && this.demand.amount !== null && numberValue > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
        input.value = this.demand.amount.toString();
      } else {
        this.demand.remaining = numberValue;
      }
    }
  }

  limitTextLength(field: 'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note', maxLength: number): void {
    const value = this.demand[field];

    if (typeof value !== 'string') {
      return;
    }

    if (value.length > maxLength) {
      this.demand[field] = value.substring(0, maxLength);
    }
  }

  limitSimpleTextLength(field: 'unit' | 'recipient' | 'address' | 'phone', maxLength: number): void {
    const value = this.demand[field];

    if (typeof value === 'string' && value.length > maxLength) {
      this.demand[field] = value.substring(0, maxLength);
    }
  }

  limitCustomArrayTextLength(field: 'customServiceTargets' | 'customConditions', index: number, maxLength: number): void {
    const value = this.demand[field][index];

    if (typeof value === 'string' && value.length > maxLength) {
      this.demand[field][index] = value.substring(0, maxLength);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if ((this.demand.image?.length ?? 0) >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    this.imageFiles.push(file);

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

      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
    if (this.demand.image) {
      this.demand.image.splice(index, 1);
    }

    if (this.demand.imageFileNames) {
      this.demand.imageFileNames.splice(index, 1);
    }

    if (this.imageFiles.length > index) {
      this.imageFiles.splice(index, 1);
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
