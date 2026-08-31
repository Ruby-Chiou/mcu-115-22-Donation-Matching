import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupplyImagePreviewComponent } from '../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { DisasterDemand, ConditionStatus } from '../../../models/agency/demand';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent],
  templateUrl: './supply-form.component.html',
  styleUrls: ['./supply-form-A.component.scss', './supply-form-B.component.scss', './supply-form-C.component.scss'],
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

    // 編輯模式
    if (serialNo) {
      this.isEditMode = true;

      const data = this.disasterDemandService.getDemands().find((item) => item.serialNo === serialNo);

      if (data) {
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

    // 整理成資料庫使用的單一物資狀態欄位
    const conditionParts: string[] = [];

    const conditionLabels: (keyof DisasterDemand['conditions'])[] = ['全新', '二手', '有擦痕', '過期', '毀損'];

    // 接受物資需求狀態
    // 只有有設定 ✔ / ✘ 才加入
    conditionLabels.forEach((key) => {
      const status = this.demand.conditions[key];

      if (status === '接受') {
        conditionParts.push(`${key}✔`);
      } else if (status === '不接受') {
        conditionParts.push(`${key}✘`);
      }
    });

    // 其它物資需求狀態
    // 只加入有填寫的內容
    this.demand.customConditions.forEach((condition) => {
      const value = condition.trim();

      if (value) {
        conditionParts.push(value);
      }
    });

    // 最後全部合併成資料庫的單一欄位
    this.demand.conditionDescription = conditionParts.join('、');

    if (this.isEditMode) {
      const originalStatus = this.disasterDemandService.getDemands().find((item) => item.serialNo === this.demand.serialNo)?.status;

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
      this.disasterDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        this.router.navigate(['/agency/supply-detail', this.demand.serialNo]);
      } else {
        this.router.navigate(['/agency/disaster']);
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

  trackByIndex(index: number): number {
    return index;
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

  limitCustomConditionLength(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    if (input.value.length > 100) {
      input.value = input.value.slice(0, 100);
    }

    this.demand.customConditions[index] = input.value;
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
}
