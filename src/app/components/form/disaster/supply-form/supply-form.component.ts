import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { DisasterDemand, ConditionStatus } from '../../../../models/agency/disaster-demand';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  templateUrl: './supply-form.component.html',
  styleUrls: [
    './supply-form-A.component.scss',
    './supply-form-B.component.scss',
    './supply-form-C.component.scss',
    './supply-form-D.component.scss',
  ],
})
export class SupplyFormComponent implements OnInit, AfterViewInit {
  isEditMode = false;
  submitted = false;
  imageFiles: File[] = [];

  // 圖片預覽
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  // 類別下拉選單
  categoryDropdownOpen = false;

  categoryOptions: NonNullable<DisasterDemand['category']>[] = [
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

  fromDetail = false;
  listNumber?: number;

  // 手動下架確認視窗
  showOffShelfWarning = false;

  // 手動下架後重新上架警告視窗
  showOnShelfWarning = false;

  // 編輯前原本的狀態
  private originalStatus: DisasterDemand['status'] = '隱藏';

  // 編輯前原本的下架原因
  private originalOffShelfReason: DisasterDemand['offShelfReason'] | undefined;

  // 暫存使用者想選擇的狀態
  private pendingStatus: DisasterDemand['status'] | undefined;

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  demand: DisasterDemand = {
    serialNo: 0,
    item: '',
    amount: null,
    unit: '',
    amountDescription: '',
    reason: '',
    description: '',

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
    address: '',
    latitude: undefined,
    longitude: undefined,
    phone: '',
    note: '',
    brand: '',
    image: [],
    imageFileNames: [],
    category: '',
    contactTimeDifferent: false,

    contactTimeMorning: false,
    contactTimeAfternoon: false,
    contactTimeEvening: false,

    weekdayMorning: false,
    weekdayAfternoon: false,
    weekdayEvening: false,

    weekendMorning: false,
    weekendAfternoon: false,
    weekendEvening: false,
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const serialNo = Number(this.route.snapshot.paramMap.get('serialNo'));

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';
    this.listNumber = Number(this.route.snapshot.queryParamMap.get('number'));

    // 編輯模式
    if (serialNo) {
      this.isEditMode = true;

      const data = this.disasterDemandService.getDemands().find((item) => item.serialNo === serialNo);

      if (data) {
        // 記錄編輯前的原始狀態
        this.originalStatus = data.status ?? '隱藏';
        this.originalOffShelfReason = data.offShelfReason;

        this.demand = {
          ...data,
          status: data.status ?? '上架',
          remaining: data.remaining ?? null,
          image: [...(data.image ?? [])],
          imageFileNames: [...(data.imageFileNames ?? [])],

          contactTimeDifferent: data.contactTimeDifferent ?? false,

          contactTimeMorning: data.contactTimeMorning ?? false,
          contactTimeAfternoon: data.contactTimeAfternoon ?? false,
          contactTimeEvening: data.contactTimeEvening ?? false,

          weekdayMorning: data.weekdayMorning ?? false,
          weekdayAfternoon: data.weekdayAfternoon ?? false,
          weekdayEvening: data.weekdayEvening ?? false,

          weekendMorning: data.weekendMorning ?? false,
          weekendAfternoon: data.weekendAfternoon ?? false,
          weekendEvening: data.weekendEvening ?? false,

          conditions: data.conditions ?? {
            全新: '',
            二手: '',
            有擦痕: '',
            過期: '',
            毀損: '',
          },

          customConditions: data.customConditions?.length ? data.customConditions : [''],
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

  selectCategory(category: NonNullable<DisasterDemand['category']>) {
    this.demand.category = category;
    this.categoryDropdownOpen = false;
  }

  setContactTimeDifferent(different: boolean) {
    this.demand.contactTimeDifferent = different;
  }

  // 判斷目前需求是否為手動下架
  isManualOffShelf(): boolean {
    return this.isEditMode && this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';
  }

  // 點擊公開狀態
  onStatusClick(event: MouseEvent, newStatus: DisasterDemand['status']): void {
    // 手動下架的需求不能重新上架
    if (newStatus === '上架' && this.isManualOffShelf()) {
      event.preventDefault();
      event.stopPropagation();

      // 強制維持下架
      this.demand.status = '下架';

      this.showOnShelfWarning = true;

      return;
    }

    // 其他狀態交給原本的狀態處理
    this.onStatusSelect(newStatus);
  }

  // 狀態選擇
  onStatusSelect(newStatus: DisasterDemand['status']): void {
    // 新增模式不需要處理原本手動下架的限制
    if (!this.isEditMode) {
      this.demand.status = newStatus;

      if (newStatus === '隱藏') {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      }

      return;
    }

    // 手動下架時嘗試重新上架
    // 判斷原本是否為手動下架
    const wasManualOffShelf = this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';

    const currentlyManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

    // 手動下架的需求固定維持下架
    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        this.demand.status = '下架';
        this.showOnShelfWarning = true;
      } else {
        this.demand.status = '下架';
      }

      return;
    }

    // 上架時選擇下架
    if (newStatus === '下架') {
      if (this.demand.status === '下架') {
        return;
      }

      this.pendingStatus = '下架';
      this.demand.status = this.originalStatus;
      this.showOffShelfWarning = true;

      return;
    }

    // 選擇隱藏
    if (newStatus === '隱藏') {
      this.demand.status = '隱藏';

      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;

      this.pendingStatus = undefined;

      return;
    }

    // 選擇上架
    if (newStatus === '上架') {
      this.demand.status = '上架';

      this.pendingStatus = undefined;

      return;
    }
  }

  // 使用者取消手動下架
  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    this.demand.status = this.originalStatus;
  }

  // 使用者選擇改為隱藏
  hideInsteadOfOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    this.demand.status = '隱藏';

    this.demand.publishedAt = undefined;
    this.demand.expectedOffShelfAt = undefined;
    this.demand.offShelfReason = undefined;
  }

  // 使用者確認手動下架
  confirmManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    const now = new Date();

    this.demand.status = '下架';

    // 設定手動下架原因
    this.demand.offShelfReason = 'manual';

    // 記錄實際手動下架時間
    this.demand.expectedOffShelfAt = now.toISOString();
  }

  // 關閉無法重新上架視窗
  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    // 手動下架永遠維持下架
    if (this.isManualOffShelf()) {
      this.demand.status = '下架';
      this.demand.offShelfReason = 'manual';
    }
  }

  async save() {
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

    // 整理成資料庫使用的單一物資狀態欄位
    const conditionParts: string[] = [];

    const conditionLabels: (keyof DisasterDemand['conditions'])[] = ['全新', '二手', '有擦痕', '過期', '毀損'];

    // 處理接受物資需求狀態
    // 只有有設定接受或不接受才加入
    conditionLabels.forEach((key) => {
      const status = this.demand.conditions[key];

      if (status === '接受') {
        conditionParts.push(`${key}✔`);
      } else if (status === '不接受') {
        conditionParts.push(`${key}✘`);
      }
    });

    // 處理其它物資需求狀態
    // 只加入有填寫的內容
    this.demand.customConditions.forEach((condition) => {
      const value = condition.trim();

      if (value) {
        conditionParts.push(value);
      }
    });

    // 將所有狀態合併成資料庫的單一欄位
    this.demand.conditionDescription = conditionParts.join('、');

    // 編輯模式
    if (this.isEditMode) {
      const originalItem = this.disasterDemandService.getDemands().find((item) => item.serialNo === this.demand.serialNo);

      const originalStatus = originalItem?.status;
      const originalOffShelfReason = originalItem?.offShelfReason;

      const originalPublishedAt = originalItem?.publishedAt;

      const now = new Date();

      // 判斷原本是否為手動下架
      const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

      const isCurrentManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

      // 手動下架禁止重新上架
      if (this.demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
        alert('此需求為使用者主動下架，無法重新上架。');

        this.demand.status = '下架';

        return;
      }

      // 處理上架狀態
      if (this.demand.status === '上架') {
        // 原本不是上架時重新設定上架日期
        if (originalStatus !== '上架') {
          this.demand.publishedAt = now.toISOString();

          if (!this.demand.createdAt) {
            this.demand.createdAt = now.toISOString();
          }
        } else if (originalPublishedAt) {
          // 原本已上架時保留原本上架日期
          this.demand.publishedAt = originalPublishedAt;
        }

        if (this.demand.publishedAt) {
          // 依照優先度重新計算預計下架日期
          this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(this.demand.publishedAt), this.demand.priority);
        }

        // 重新上架後清除之前的下架原因
        this.demand.offShelfReason = undefined;
      }

      // 處理隱藏狀態
      else if (this.demand.status === '隱藏') {
        // 隱藏後視為尚未上架
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;

        // 隱藏不是手動下架
        this.demand.offShelfReason = undefined;
      }

      // 處理下架狀態
      else if (this.demand.status === '下架') {
        // 原本手動下架或這次確認下架時保留原本的下架時間
        if (!this.demand.offShelfReason) {
          this.demand.offShelfReason = 'manual';
        }

        if (!this.demand.expectedOffShelfAt) {
          this.demand.expectedOffShelfAt = now.toISOString();
        }
      }

      // 更新資料
      this.disasterDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/supply-detail', this.demand.serialNo], {
          queryParams: {
            number: this.listNumber,
          },
        });
      } else {
        this.router.navigate(['/agency/disaster']);
      }
    }

    // 新增模式
    else {
      // 按下發布需求的時間
      const createdDate = new Date();

      // 記錄發布日期
      this.demand.createdAt = createdDate.toISOString();

      // 新增時選擇上架
      if (this.demand.status === '上架') {
        // 上架日期等於發布日期
        this.demand.publishedAt = createdDate.toISOString();

        // 計算預計下架日期
        this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, this.demand.priority);

        // 新增上架不應該有下架原因
        this.demand.offShelfReason = undefined;
      } else {
        // 隱藏時尚未上架
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      }

      this.disasterDemandService.addDemand(this.demand);

      this.router.navigate(['/agency/disaster']);
    }
  }

  // 新增自訂條件
  addCustomCondition() {
    if (this.demand.customConditions.length < 5) {
      this.demand.customConditions.push('');
    }
  }

  // 移除自訂條件
  removeCustomCondition(index: number) {
    this.demand.customConditions.splice(index, 1);

    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }
  }

  // 計算預計下架日期
  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 7);
        break;
    }

    return offShelfDate.toISOString();
  }

  // 追蹤自訂條件索引
  trackByIndex(index: number): number {
    return index;
  }

  // 切換物資狀態
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

  // 取得物資狀態圖示
  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  // 處理剩餘需求數量變更
  onRemainingChange() {
    if (this.demand.remaining !== null && this.demand.remaining !== undefined) {
      this.demand.remaining = Number(this.demand.remaining);

      // 限制剩餘需求不可超過需求數量
      if (this.demand.amount !== null && this.demand.remaining > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
      }
    }
  }

  // 限制數字欄位長度
  limitNumberLength(event: Event, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      this.demand.amount = value;

      if (!this.isEditMode) {
        this.demand.remaining = value;
      }
    }

    if (field === 'remaining') {
      if (value !== null && this.demand.amount !== null && value > this.demand.amount) {
        this.demand.remaining = this.demand.amount;
        input.value = this.demand.amount.toString();
      } else {
        this.demand.remaining = value;
      }
    }
  }

  // 限制文字欄位長度
  limitTextLength(
    event: Event,
    field: 'item' | 'unit' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'address' | 'phone' | 'note',
    maxLength: number
  ) {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    this.demand[field] = input.value;
  }

  // 限制自訂條件欄位長度
  limitCustomConditionLength(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    if (input.value.length > 100) {
      input.value = input.value.slice(0, 100);
    }

    this.demand.customConditions[index] = input.value;
  }

  // 選擇圖片
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 限制最多五張圖片
    if (this.imageFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    // 限制圖片大小為五 MB
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

    // 清空圖片輸入欄位
    input.value = '';
  }

  // 移除圖片
  removeImage(index: number) {
    this.imageFiles.splice(index, 1);

    if (this.demand.image) {
      this.demand.image.splice(index, 1);
    }

    if (this.demand.imageFileNames) {
      this.demand.imageFileNames.splice(index, 1);
    }
  }

  // 開啟圖片預覽
  openImagePreview(image: string, imageName: string): void {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  // 關閉圖片預覽
  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }
}
