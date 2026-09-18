import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
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

  // =========================================================
  // 固定需求對象
  // 資料庫改成使用陣列，因此前端也改成 string[]
  // =========================================================
  serviceTargetOptions: string[] = ['老人', '嬰幼兒', '孩童', '青少年', '身障', '貧困', '重症照護', '動物', '無家者'];

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

    // =========================================================
    // 服務對象
    // 改成陣列，不再使用 boolean object
    // =========================================================
    serviceTargets: [],

    // 自訂需求對象維持原本陣列
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

  // =========================================================
  // 點擊類別下拉選單以外的地方時關閉
  // =========================================================
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

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    const id = Number(rawId);

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    console.log('[DailyFormComponent] 取得路由資料庫 id：', {
      rawId,
      id,
    });

    /*
     * 新增頁：
     * /agency/daily-form
     */
    if (rawId === null) {
      this.isEditMode = false;

      console.log('[DailyFormComponent] 新增模式');

      return;
    }

    /*
     * 編輯頁：
     * /agency/daily-edit/:id
     */
    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyFormComponent] 編輯網址的資料庫 id 不正確：', rawId);

      this.router.navigate(['/agency/daily']);

      return;
    }

    this.isEditMode = true;

    console.log('[DailyFormComponent] 編輯模式，資料庫 id：', id);

    try {
      const data = await this.dailyDemandService.getDemandById(id);

      console.log('[DailyFormComponent] Service 回傳編輯資料：', data);

      if (!data) {
        console.error('[DailyFormComponent] 找不到要編輯的日常需求，id：', id);

        this.router.navigate(['/agency/daily']);

        return;
      }

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

        status: data.status ?? '隱藏',

        remaining: data.remaining ?? null,

        receiveMethod:
          data.receiveMethod && typeof data.receiveMethod === 'object'
            ? {
                ...data.receiveMethod,
              }
            : {
                寄送: false,
                面交: false,
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

        serviceTargets,

        customServiceTargets: data.customServiceTargets?.length ? [...data.customServiceTargets] : [''],

        conditions: data.conditions
          ? {
              ...data.conditions,
            }
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

      /*
       * 外部圖片可能遇到 CORS。
       * 單張圖片失敗不能阻止整個表單載入。
       */
      const files = await Promise.all(
        (data.image ?? []).map(async (image, index) => {
          const fileName = data.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

          try {
            return await this.base64ToFile(image, fileName);
          } catch (error) {
            console.warn('[DailyFormComponent] 圖片無法轉成 File，略過：', image, error);

            return null;
          }
        })
      );

      this.imageFiles = files.filter((file): file is File => file !== null);

      this.cdr.detectChanges();

      console.log('[DailyFormComponent] 編輯資料已載入：', this.demand);
    } catch (error) {
      console.error('[DailyFormComponent] 載入日常編輯資料失敗：', error);

      alert('載入日常需求失敗');

      this.router.navigate(['/agency/daily']);
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

  async base64ToFile(imageSource: string, fileName: string): Promise<File | null> {
    if (!imageSource.startsWith('data:')) {
      console.warn('[DailyFormComponent] 外部圖片不轉換為 File，保留原網址：', imageSource);

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

  // =========================================================
  // 接收方式
  // =========================================================
  get hasReceiveMethod(): boolean {
    return this.demand.receiveMethod['寄送'] || this.demand.receiveMethod['面交'];
  }

  // =========================================================
  // 需求對象
  // =========================================================

  /**
   * 判斷需求對象是否已被選取
   */
  isServiceTargetSelected(target: string): boolean {
    return this.demand.serviceTargets.includes(target);
  }

  /**
   * 點擊需求對象 checkbox
   *
   * 如果原本沒有 → 加入陣列
   * 如果原本有 → 從陣列移除
   */
  toggleServiceTarget(target: string): void {
    const index = this.demand.serviceTargets.indexOf(target);

    if (index === -1) {
      this.demand.serviceTargets.push(target);
    } else {
      this.demand.serviceTargets.splice(index, 1);
    }

    // 即時更新資料庫使用的合併欄位
    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();
  }

  // =========================================================
  // 儲存
  // =========================================================
  async save(): Promise<void> {
    this.submitted = true;

    // =======================================================
    // 需求對象改成陣列後：
    // 只要固定需求對象陣列有資料，或自訂需求對象有資料，
    // 就代表至少有選擇一個需求對象。
    // =======================================================
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

    // =======================================================
    // 需求對象驗證
    // =======================================================
    if (!this.hasServiceTarget) {
      this.scrollToServiceTarget();
      return;
    }

    // =======================================================
    // 清除空白的自訂欄位
    // =======================================================
    this.demand.customConditions = this.demand.customConditions.filter((item) => item.trim() !== '');

    this.demand.customServiceTargets = this.demand.customServiceTargets.filter((item) => item.trim() !== '');

    // =======================================================
    // 保留至少一個輸入框
    // =======================================================
    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }

    // =======================================================
    // 建立資料庫使用的合併欄位
    // =======================================================
    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();

    // =======================================================
    // 編輯
    // =======================================================
    if (this.isEditMode) {
      const originalStatus = this.dailyDemandService.getDemands().find((item) => item.id === this.demand.id)?.status;

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

      try {
        await this.dailyDemandService.updateDemand(this.demand);

        if (this.fromDetail) {
          await this.router.navigate(['/agency/daily-detail', this.demand.id]);
        } else {
          await this.router.navigate(['/agency/daily'], {
            queryParams: {
              refresh: Date.now(),
            },
          });
        }
      } catch (error) {
        console.error('修改日常物資需求失敗：', error);

        alert('修改失敗，請稍後再試。');
      }
    } else {
      // =====================================================
      // 新增
      // =====================================================

      const createdDate = new Date();

      // 創建日期
      this.demand.createdAt = createdDate.toISOString();

      // 如果新增時選擇「上架」
      if (this.demand.status === '上架') {
        this.demand.publishedAt = createdDate.toISOString();

        this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, this.demand.priority);
      } else {
        // 隱藏：尚未上架
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
      }

      try {
        await this.dailyDemandService.addDemand(this.demand);

        await this.router.navigate(['/agency/daily'], {
          queryParams: {
            refresh: Date.now(),
          },
        });
      } catch (error) {
        console.error('新增日常物資需求失敗：', error);

        alert('新增失敗，請稍後再試。');
      }
    }
  }

  // =========================================================
  // 整合需求對象
  //
  // 固定需求對象：
  // ['老人', '嬰幼兒', '身障']
  //
  // 自訂需求對象：
  // ['獨居者', '低收入戶']
  //
  // 最後：
  // 老人、嬰幼兒、身障、獨居者、低收入戶
  // =========================================================
  buildServiceTargetDescription(): string {
    const targets: string[] = [];

    // 固定需求對象直接從陣列取得
    this.demand.serviceTargets.forEach((target) => {
      if (target.trim()) {
        targets.push(`${target}✓`);
      }
    });

    // 自訂需求對象
    this.demand.customServiceTargets.forEach((target) => {
      const value = target.trim();

      if (value) {
        targets.push(value);
      }
    });

    return targets.join('、');
  }

  // =========================================================
  // 整合物資需求狀態
  // =========================================================
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

  // =========================================================
  // 自訂物資狀態
  // =========================================================
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

  // =========================================================
  // 預計下架日期
  // =========================================================
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

  // =========================================================
  // 自訂需求對象
  // =========================================================
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

  // =========================================================
  // 物資狀態
  // =========================================================
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

  // =========================================================
  // 剩餘需求
  // =========================================================
  onRemainingChange() {
    if (this.demand.remaining !== null && this.demand.remaining !== undefined) {
      this.demand.remaining = Number(this.demand.remaining);

      // 剩餘需求不可超過需求數量
      if (this.demand.amount !== null && this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  // =========================================================
  // 數字長度限制
  // =========================================================
  limitNumberLength(event: Event, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    // 只允許數字
    let value = input.value.replace(/[^0-9]/g, '');

    // 最多 10 位
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

  // =========================================================
  // 一般文字長度限制
  // =========================================================
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

  // =========================================================
  // 自訂陣列文字長度限制
  // =========================================================
  limitCustomArrayTextLength(field: 'customServiceTargets' | 'customConditions', index: number, maxLength: number) {
    const value = this.demand[field][index];

    if (typeof value === 'string' && value.length > maxLength) {
      this.demand[field][index] = value.substring(0, maxLength);
    }
  }

  // =========================================================
  // 圖片
  // =========================================================
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
