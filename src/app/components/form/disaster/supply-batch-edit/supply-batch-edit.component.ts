import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../../core/services/disaster-demand.service';
import { EditableDisasterDemand } from '../../../../models/agency/disaster-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-supply-batch-edit',
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent],
  templateUrl: './supply-batch-edit.component.html',
  styleUrls: ['./supply-batch-edit-A.component.scss', './supply-batch-edit-B.component.scss', './supply-batch-edit-C.component.scss'],
})
export class SupplyBatchEditComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  editDemands: EditableDisasterDemand[] = [];

  // 圖片預覽
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  categoryOptions: NonNullable<EditableDisasterDemand['category']>[] = [
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

  constructor(
    private service: DisasterDemandService,
    private router: Router
  ) {}

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
      this.editDemands.forEach((demand) => {
        demand.categoryDropdownOpen = false;
      });
    }
  }

  ngOnInit() {
    const data = localStorage.getItem('editDemands');

    if (data) {
      this.editDemands = JSON.parse(data).map((item: any) => ({
        ...item,

        conditions: item.conditions ?? {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        },

        customConditions: item.customConditions?.length ? [...item.customConditions] : [''],

        conditionDescription: item.conditionDescription ?? '',

        unit: item.unit || '',
        amountDescription: item.amountDescription || '',
        status: item.status ?? '隱藏',
        remaining: item.remaining ?? item.amount,
        createdAt: item.createdAt,
        publishedAt: item.publishedAt,
        expectedOffShelfAt: item.expectedOffShelfAt,
        brand: item.brand || '',
        category: item.category || '',
        image: [...(item.image ?? [])],
        imageFileNames: [...(item.imageFileNames ?? [])],

        // 聯絡時間
        contactTimeDifferent: item.contactTimeDifferent ?? false,

        contactTimeMorning: item.contactTimeMorning ?? false,
        contactTimeAfternoon: item.contactTimeAfternoon ?? false,
        contactTimeEvening: item.contactTimeEvening ?? false,

        weekdayMorning: item.weekdayMorning ?? false,
        weekdayAfternoon: item.weekdayAfternoon ?? false,
        weekdayEvening: item.weekdayEvening ?? false,

        weekendMorning: item.weekendMorning ?? false,
        weekendAfternoon: item.weekendAfternoon ?? false,
        weekendEvening: item.weekendEvening ?? false,

        // 批次編輯專用
        categoryDropdownOpen: false,
        imageFiles: [],
      }));
    }

    const imagePromises = this.editDemands.map(async (demand) => {
      if (demand.image && demand.image.length > 0) {
        const files = await Promise.all(
          demand.image.map((img, index) => {
            const fileName = demand.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

            return this.base64ToFile(img, fileName);
          })
        );

        demand.imageFiles = files;
      }
    });

    Promise.all(imagePromises).then(() => {
      this.cdr.detectChanges();
    });

    console.log('批次修改資料:', this.editDemands);
  }

  setContactTimeDifferent(demand: EditableDisasterDemand, different: boolean): void {
    demand.contactTimeDifferent = different;
  }

  toggleCategoryDropdown(demand: EditableDisasterDemand) {
    demand.categoryDropdownOpen = !demand.categoryDropdownOpen;
  }

  selectCategory(demand: EditableDisasterDemand, category: NonNullable<EditableDisasterDemand['category']>) {
    demand.category = category;
    demand.categoryDropdownOpen = false;
  }

  // 限制剩餘需求最高只能填到需求數量
  onRemainingChange(demand: any) {
    if (demand.amount !== undefined && demand.amount !== null && demand.amount !== '') {
      const maxAmount = Number(demand.amount);
      const currentRemaining = Number(demand.remaining);

      if (!isNaN(maxAmount) && !isNaN(currentRemaining)) {
        if (currentRemaining > maxAmount) {
          demand.remaining = maxAmount;
        }
      }
    }
  }

  limitNumberLength(event: Event, demand: any, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      demand.amount = value;

      // 需求數量變更時，剩餘需求同步更新
      demand.remaining = value;
    }

    if (field === 'remaining') {
      if (value !== null && demand.amount !== null && value > demand.amount) {
        demand.remaining = demand.amount;
        input.value = demand.amount.toString();
      } else {
        demand.remaining = value;
      }
    }
  }

  // 達到最高字數後禁止繼續輸入
  preventMaxLength(event: KeyboardEvent, maxLength: number): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;

    // Ctrl / Command / Alt 等快捷鍵允許使用
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Backspace、Delete、方向鍵、Tab 等功能鍵允許使用
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // 有選取文字時允許輸入，因為會取代選取內容
    const selectionLength = input.selectionEnd! - input.selectionStart!;

    // 已達最高字數，而且沒有選取任何文字 → 禁止輸入
    if (input.value.length >= maxLength && selectionLength === 0) {
      event.preventDefault();
    }
  }

  onImageSelected(event: Event, demand: EditableDisasterDemand) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (demand.imageFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    demand.imageFiles.push(file);

    const reader = new FileReader();

    reader.onload = () => {
      if (!demand.image) {
        demand.image = [];
      }

      if (!demand.imageFileNames) {
        demand.imageFileNames = [];
      }

      demand.image.push(reader.result as string);
      demand.imageFileNames.push(file.name);
    };

    reader.readAsDataURL(file);

    input.value = '';
  }

  removeImage(demand: EditableDisasterDemand, index: number) {
    demand.imageFiles.splice(index, 1);

    if (demand.image) {
      demand.image.splice(index, 1);
    }

    if (demand.imageFileNames) {
      demand.imageFileNames.splice(index, 1);
    }
  }

  saveAll() {
    // =========================
    // 清除舊錯誤 + 檢查必填
    // =========================
    this.editDemands.forEach((item) => {
      item.itemError = false;
      item.amountError = false;
      item.unitError = false;
      item.reasonError = false;
      item.descriptionError = false;
      item.addressError = false;
      item.phoneError = false;
      item.remainingError = false;

      item.categoryError = false;

      if (!item.item) {
        item.itemError = true;
      }

      if (!item.amount || isNaN(Number(item.amount))) {
        item.amountError = true;
      }

      if (!item.unit || !item.unit.trim()) {
        item.unitError = true;
      }
      if (item.remaining === undefined || item.remaining === null) {
        item.remainingError = true;
      }

      if (Number(item.remaining) < 0) {
        item.remainingError = true;
      }

      if (!item.reason) {
        item.reasonError = true;
      }

      if (!item.description) {
        item.descriptionError = true;
      }

      if (!item.category) {
        item.categoryError = true;
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
      (item) =>
        item.itemError ||
        item.amountError ||
        item.unitError ||
        item.reasonError ||
        item.descriptionError ||
        item.categoryError ||
        item.addressError ||
        item.phoneError ||
        item.remainingError
    );

    if (invalid) {
      this.scrollToFirstError();
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

      const conditionParts: string[] = [];

      const conditionLabels: (keyof EditableDisasterDemand['conditions'])[] = ['全新', '二手', '有擦痕', '過期', '毀損'];

      // 接受物資需求狀態
      conditionLabels.forEach((key) => {
        const status = item.conditions[key];

        if (status === '接受') {
          conditionParts.push(`${key}✔`);
        } else if (status === '不接受') {
          conditionParts.push(`${key}✘`);
        }
      });

      // 其它物資需求狀態
      item.customConditions.forEach((condition) => {
        const value = condition.trim();

        if (value) {
          conditionParts.push(value);
        }
      });

      // 合併成資料庫使用的單一欄位
      item.conditionDescription = conditionParts.join('、');
    });

    // 清除空白自訂欄位
    this.editDemands.forEach((item) => {
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

      // 至少保留一個輸入框
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }

      const originalItem = this.service.getDemands().find((demand) => demand.serialNo === item.serialNo);

      const originalStatus = originalItem?.status;
      const originalPublishedAt = originalItem?.publishedAt;

      if (item.status === '上架') {
        if (originalPublishedAt) {
          item.publishedAt = originalPublishedAt;

          item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(originalPublishedAt), item.priority);
        } else {
          const publishedDate = new Date();

          item.publishedAt = publishedDate.toISOString();

          if (!item.createdAt) {
            item.createdAt = publishedDate.toISOString();
          }
          item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(publishedDate, item.priority);
        }
      } else if (item.status === '隱藏') {
        item.publishedAt = undefined;
        item.expectedOffShelfAt = undefined;
      } else if (item.status === '下架') {
        if (originalPublishedAt) {
          item.publishedAt = originalPublishedAt;
        }

        item.expectedOffShelfAt = new Date().toISOString();
      }

      this.service.updateDemand(item);
    });

    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/disaster']);
  }

  scrollToFirstError() {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.invalid, .invalid-box') as HTMLElement | null;

      if (firstErrorElement) {
        const top = firstErrorElement.getBoundingClientRect().top + window.scrollY - 120;

        window.scrollTo({
          top,
          behavior: 'smooth',
        });
      }
    }, 100);
  }

  // 接受物資狀態切換
  toggleCondition(demand: EditableDisasterDemand, key: keyof EditableDisasterDemand['conditions']) {
    const current = demand.conditions[key];

    if (current === '') {
      demand.conditions[key] = '接受';
    } else if (current === '接受') {
      demand.conditions[key] = '不接受';
    } else {
      demand.conditions[key] = '';
    }
  }

  // 顯示接受物資狀態圖示
  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  // 其他物品狀態動態增減
  addCustomCondition(demand: any) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: EditableDisasterDemand, index: number) {
    demand.customConditions.splice(index, 1);

    if (demand.customConditions.length === 0) {
      demand.customConditions.push('');
    }
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: EditableDisasterDemand['priority']): string {
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

  cancel() {
    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/disaster']);
  }
}
