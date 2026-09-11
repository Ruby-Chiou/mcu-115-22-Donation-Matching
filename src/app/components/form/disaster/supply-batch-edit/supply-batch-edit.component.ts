import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { EditableDisasterDemand } from '../../../../models/agency/disaster-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

@Component({
  selector: 'app-supply-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  templateUrl: './supply-batch-edit.component.html',
  styleUrls: ['./supply-batch-edit-A.component.scss', './supply-batch-edit-B.component.scss', './supply-batch-edit-C.component.scss'],
})
export class SupplyBatchEditComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  editDemands: EditableDisasterDemand[] = [];

  // 手動下架確認 Modal
  showOffShelfWarning = false;

  // 無法重新上架 Modal
  showOnShelfWarning = false;

  // 目前正在處理狀態變更的資料
  pendingStatusDemand: EditableDisasterDemand | null = null;

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

    return new File([blob], fileName, {
      type: blob.type,
    });
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

  // 初始化
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

        offShelfReason: item.offShelfReason,

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

    // 載入圖片
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

  // 設定聯絡時間
  setContactTimeDifferent(demand: EditableDisasterDemand, different: boolean): void {
    demand.contactTimeDifferent = different;
  }

  // 切換類別下拉選單
  toggleCategoryDropdown(demand: EditableDisasterDemand) {
    demand.categoryDropdownOpen = !demand.categoryDropdownOpen;
  }

  // 選擇類別
  selectCategory(demand: EditableDisasterDemand, category: NonNullable<EditableDisasterDemand['category']>) {
    demand.category = category;
    demand.categoryDropdownOpen = false;
  }

  // 處理批次編輯的狀態選擇
  onStatusSelect(demand: EditableDisasterDemand, newStatus: EditableDisasterDemand['status']): void {
    // 取得目前 Service 裡真正的原始資料
    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);

    const originalStatus = originalItem?.status ?? demand.status;

    const originalOffShelfReason = originalItem?.offShelfReason;

    // 手動下架時嘗試重新上架
    const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

    const isCurrentManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

    if (newStatus === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
      // 保持下架
      demand.status = '下架';

      // 記錄目前正在處理的資料
      this.pendingStatusDemand = demand;

      // 顯示無法重新上架 Modal
      this.showOnShelfWarning = true;

      return;
    }

    // 選擇下架
    if (newStatus === '下架') {
      // 本來就是下架時不需要再次確認
      if (demand.status === '下架') {
        return;
      }

      // 記錄正在處理的資料
      this.pendingStatusDemand = demand;

      // 暫時恢復原本狀態
      demand.status = originalStatus;

      // 顯示手動下架確認 Modal
      this.showOffShelfWarning = true;

      return;
    }

    // 選擇隱藏
    if (newStatus === '隱藏') {
      demand.status = '隱藏';

      // 隱藏後視為尚未上架
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;

      // 隱藏不是手動下架
      demand.offShelfReason = undefined;

      this.pendingStatusDemand = null;

      return;
    }

    // 選擇上架
    if (newStatus === '上架') {
      demand.status = '上架';

      this.pendingStatusDemand = null;

      return;
    }
  }

  // 取消手動下架
  cancelManualOffShelf(): void {
    const demand = this.pendingStatusDemand;

    this.showOffShelfWarning = false;
    this.pendingStatusDemand = null;

    if (!demand) {
      return;
    }

    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);

    if (originalItem) {
      demand.status = originalItem.status;
    }
  }

  // 選擇改為隱藏
  hideInsteadOfOffShelf(): void {
    const demand = this.pendingStatusDemand;

    this.showOffShelfWarning = false;
    this.pendingStatusDemand = null;

    if (!demand) {
      return;
    }

    demand.status = '隱藏';

    demand.publishedAt = undefined;
    demand.expectedOffShelfAt = undefined;
    demand.offShelfReason = undefined;
  }

  // 確認手動下架
  confirmManualOffShelf(): void {
    const demand = this.pendingStatusDemand;

    this.showOffShelfWarning = false;
    this.pendingStatusDemand = null;

    if (!demand) {
      return;
    }

    const now = new Date();

    // 改成下架
    demand.status = '下架';

    // 記錄為使用者主動下架
    demand.offShelfReason = 'manual';

    // 記錄實際手動下架時間
    demand.expectedOffShelfAt = now.toISOString();
  }

  // 關閉無法重新上架視窗
  closeOnShelfWarning(): void {
    const demand = this.pendingStatusDemand;

    this.showOnShelfWarning = false;
    this.pendingStatusDemand = null;

    if (!demand) {
      return;
    }

    demand.status = '下架';
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

  // 限制數字欄位長度
  limitNumberLength(event: Event, demand: any, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      demand.amount = value;

      // 需求數量變更時同步更新剩餘需求
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

    // Ctrl、Command、Alt 等快捷鍵允許使用
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

    // 已達最高字數且沒有選取任何文字時禁止輸入
    if (input.value.length >= maxLength && selectionLength === 0) {
      event.preventDefault();
    }
  }

  // 選擇圖片
  onImageSelected(event: Event, demand: EditableDisasterDemand) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 限制最多五張圖片
    if (demand.imageFiles.length >= 5) {
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
    demand.imageFiles.push(file);

    // 讀取圖片
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

  // 移除圖片
  removeImage(demand: EditableDisasterDemand, index: number) {
    demand.imageFiles.splice(index, 1);

    if (demand.image) {
      demand.image.splice(index, 1);
    }

    if (demand.imageFileNames) {
      demand.imageFileNames.splice(index, 1);
    }
  }

  // 儲存全部資料
  saveAll() {
    // 清除舊錯誤並檢查必填欄位
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

    // 判斷是否有錯誤
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

    // 整理物資狀態
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

      // 處理接受物資需求狀態
      conditionLabels.forEach((key) => {
        const status = item.conditions[key];

        if (status === '接受') {
          conditionParts.push(`${key}✔`);
        } else if (status === '不接受') {
          conditionParts.push(`${key}✘`);
        }
      });

      // 處理其它物資需求狀態
      item.customConditions.forEach((condition) => {
        const value = condition.trim();

        if (value) {
          conditionParts.push(value);
        }
      });

      // 合併成資料庫使用的單一欄位
      item.conditionDescription = conditionParts.join('、');
    });

    // 儲存每一筆資料
    this.editDemands.forEach((item) => {
      // 清除空白自訂欄位
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

      // 至少保留一個輸入框
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }

      const originalItem = this.service.getDemands().find((demand) => demand.serialNo === item.serialNo);

      const originalStatus = originalItem?.status;

      const originalOffShelfReason = originalItem?.offShelfReason;

      const originalPublishedAt = originalItem?.publishedAt;

      const now = new Date();

      // 處理上架狀態
      if (item.status === '上架') {
        // 手動下架禁止重新上架
        if (originalStatus === '下架' && originalOffShelfReason === 'manual') {
          alert(`需求編號 ${item.serialNo} 為使用者主動下架，無法重新上架。`);

          item.status = '下架';

          item.offShelfReason = 'manual';

          // 保留原本手動下架時間
          if (originalItem?.expectedOffShelfAt) {
            item.expectedOffShelfAt = originalItem.expectedOffShelfAt;
          }

          // 保留原本上架日期
          if (originalPublishedAt) {
            item.publishedAt = originalPublishedAt;
          }

          return;
        }

        // 處理可以重新上架的資料
        if (originalStatus !== '上架') {
          item.publishedAt = now.toISOString();

          if (!item.createdAt) {
            item.createdAt = now.toISOString();
          }
        } else if (originalPublishedAt) {
          // 原本已上架時保留原本上架日期
          item.publishedAt = originalPublishedAt;
        }

        // 依照優先度重新計算預計下架日期
        if (item.publishedAt) {
          item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
        }

        // 重新上架後清除下架原因
        item.offShelfReason = undefined;
      }

      // 處理隱藏狀態
      else if (item.status === '隱藏') {
        // 隱藏後視為尚未上架
        item.publishedAt = undefined;

        item.expectedOffShelfAt = undefined;

        // 隱藏不是下架
        item.offShelfReason = undefined;
      }

      // 處理下架狀態
      else if (item.status === '下架') {
        // 儲存時不要重新產生下架時間
        if (!item.offShelfReason) {
          item.offShelfReason = 'manual';
        }

        // 保留原本上架日期
        if (originalPublishedAt) {
          item.publishedAt = originalPublishedAt;
        }

        // 如果沒有下架時間才補上
        if (!item.expectedOffShelfAt) {
          item.expectedOffShelfAt = now.toISOString();
        }
      }

      // 更新 Service
      this.service.updateDemand(item);
    });

    // 清除批次編輯暫存資料
    localStorage.removeItem('editDemands');

    // 回到災害需求列表
    this.router.navigate(['/agency/disaster']);
  }

  // 捲動到第一個錯誤位置
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

  // 切換接受物資狀態
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

  // 新增其他物資狀態
  addCustomCondition(demand: any) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  // 移除其他物資狀態
  removeCustomCondition(demand: EditableDisasterDemand, index: number) {
    demand.customConditions.splice(index, 1);

    if (demand.customConditions.length === 0) {
      demand.customConditions.push('');
    }
  }

  // 計算預計下架日期
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

  // 追蹤自訂條件索引
  trackByIndex(index: number): number {
    return index;
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

  // 取消批次編輯
  cancel() {
    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/disaster']);
  }
}
