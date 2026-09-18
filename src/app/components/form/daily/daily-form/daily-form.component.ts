import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-daily-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
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

  private originalStatus: DailyDemand['status'] = '隱藏';
  private originalOffShelfReason: DailyDemand['offShelfReason'] | undefined;
  private pendingStatus: DailyDemand['status'] | undefined;

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  get isManualOffShelf(): boolean {
    return this.isEditMode && this.demand.status === '下架' && this.demand.offShelfReason === 'manual';
  }

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

  constructor(
    private dailyDemandService: DailyDemandService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

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

    if (serialNo) {
      this.isEditMode = true;

      const data = this.dailyDemandService.getDemands().find((item) => item.serialNo === serialNo);

      if (data) {
        this.originalStatus = data.status ?? '隱藏';
        this.originalOffShelfReason = data.offShelfReason;

        let serviceTargets: string[] = [];

        if (Array.isArray(data.serviceTargets)) {
          serviceTargets = [...data.serviceTargets];
        } else if (data.serviceTargets && typeof data.serviceTargets === 'object') {
          serviceTargets = Object.entries(data.serviceTargets)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key);
        }

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
          latitude: data.latitude,
          longitude: data.longitude,
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

          serviceTargets: serviceTargets,

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

  onStatusClick(event: MouseEvent, newStatus: DailyDemand['status']): void {
    if (newStatus === '上架' && this.isManualOffShelf) {
      event.preventDefault();
      event.stopPropagation();

      this.demand.status = '下架';
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(newStatus);
  }

  onStatusSelect(newStatus: DailyDemand['status']): void {
    if (!this.isEditMode) {
      this.demand.status = newStatus;

      if (newStatus === '隱藏') {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      }

      return;
    }

    const wasManualOffShelf = this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';

    const currentlyManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        this.demand.status = '下架';
        this.showOnShelfWarning = true;
      } else {
        this.demand.status = '下架';
      }

      return;
    }

    if (newStatus === '下架') {
      if (this.demand.status === '下架') {
        return;
      }

      this.pendingStatus = '下架';
      this.demand.status = this.originalStatus;
      this.showOffShelfWarning = true;
      return;
    }

    if (newStatus === '隱藏') {
      this.demand.status = '隱藏';

      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;

      this.pendingStatus = undefined;

      return;
    }

    if (newStatus === '上架') {
      this.demand.status = '上架';
      this.pendingStatus = undefined;

      return;
    }
  }

  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;
    this.demand.status = this.originalStatus;
  }

  hideInsteadOfOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    this.demand.status = '隱藏';

    this.demand.publishedAt = undefined;
    this.demand.expectedOffShelfAt = undefined;
    this.demand.offShelfReason = undefined;
  }

  confirmManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    const now = new Date();

    this.demand.status = '下架';
    this.demand.offShelfReason = 'manual';
    this.demand.expectedOffShelfAt = now.toISOString();
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.isManualOffShelf) {
      this.demand.status = '下架';
      this.demand.offShelfReason = 'manual';
    }
  }

  async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: blob.type,
    });
  }

  get hasReceiveMethod(): boolean {
    return this.demand.receiveMethod['寄送'] || this.demand.receiveMethod['面交'];
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

  // =========================================================
  // 地址 → 經緯度
  // =========================================================
  async getCoordinatesFromAddress(address: string): Promise<boolean> {
    const url = 'https://nominatim.openstreetmap.org/search';

    const params = {
      // 原本城市碼／台灣設定維持不變
      q: `${address}, Taiwan`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'tw',
    };

    try {
      const results = await firstValueFrom(this.http.get<NominatimSearchResult[]>(url, { params }));

      if (!results || results.length === 0) {
        return false;
      }

      const result = results[0];

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      this.demand.latitude = latitude;
      this.demand.longitude = longitude;

      console.log('地址：', address.trim());
      console.log('轉換後緯度：', this.demand.latitude);
      console.log('轉換後經度：', this.demand.longitude);
      console.log('Nominatim 找到的位置：', result.display_name);

      return true;
    } catch (error) {
      console.error('地址轉換經緯度失敗：', error);

      return false;
    }
  }

  // =========================================================
  // 儲存
  // =========================================================
  async save() {
    this.submitted = true;

    this.hasServiceTarget = this.demand.serviceTargets.length > 0 || this.demand.customServiceTargets.some((target) => target.trim());

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

    // =======================================================
    // 地址轉換經緯度
    // =======================================================
    const addressSuccess = await this.getCoordinatesFromAddress(this.demand.address);

    if (!addressSuccess) {
      alert('無法找到此地址的位置，請確認地址是否正確。');

      return;
    }

    // =======================================================
    // 清除空白自訂欄位
    // =======================================================
    this.demand.customConditions = this.demand.customConditions.filter((item) => item.trim() !== '');

    this.demand.customServiceTargets = this.demand.customServiceTargets.filter((item) => item.trim() !== '');

    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();

    // =======================================================
    // 編輯
    // =======================================================
    if (this.isEditMode) {
      const originalItem = this.dailyDemandService.getDemands().find((item) => item.serialNo === this.demand.serialNo);

      const originalStatus = originalItem?.status;
      const originalOffShelfReason = originalItem?.offShelfReason;
      const originalPublishedAt = originalItem?.publishedAt;

      const now = new Date();

      const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

      const isCurrentManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

      if (this.demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
        alert('此需求為使用者主動下架，無法重新上架。');

        this.demand.status = '下架';

        return;
      }

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

        this.demand.offShelfReason = undefined;
      } else if (this.demand.status === '隱藏') {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      } else if (this.demand.status === '下架') {
        if (!this.demand.offShelfReason) {
          this.demand.offShelfReason = 'manual';
        }

        if (!this.demand.expectedOffShelfAt) {
          this.demand.expectedOffShelfAt = now.toISOString();
        }
      }

      this.dailyDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/daily-detail', this.demand.serialNo]);
      } else {
        this.router.navigate(['/agency/daily']);
      }
    } else {
      // =====================================================
      // 新增
      // =====================================================
      const createdDate = new Date();

      this.demand.createdAt = createdDate.toISOString();

      if (this.demand.status === '上架') {
        this.demand.publishedAt = createdDate.toISOString();

        this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, this.demand.priority);

        this.demand.offShelfReason = undefined;
      } else {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      }

      this.dailyDemandService.addDemand(this.demand);

      this.router.navigate(['/agency/daily']);
    }
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

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();
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

      if (this.demand.amount !== null && this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  limitNumberLength(event: Event, field: 'amount' | 'remaining') {
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

  limitTextLength(field: 'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note', maxLength: number) {
    const value = this.demand[field];

    if (typeof value !== 'string') {
      return;
    }

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

    if (this.imageFiles.length >= 5) {
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
    };

    reader.readAsDataURL(file);

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
