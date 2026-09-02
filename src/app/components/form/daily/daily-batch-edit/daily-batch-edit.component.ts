import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DailyDemandService } from '../../../../core/services/daily-demand.service';
import { EditableDailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';

@Component({
  selector: 'app-daily-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent],
  templateUrl: './daily-batch-edit.component.html',
  styleUrls: [
    './daily-batch-edit-A.component.scss',
    './daily-batch-edit-B.component.scss',
    './daily-batch-edit-C.component.scss',
    './daily-batch-edit-D.component.scss',
  ],
})
export class DailyBatchEditComponent implements OnInit {
  editDemands: EditableDailyDemand[] = [];

  // =========================
  // 圖片
  // =========================
  imageFiles: { [serialNo: number]: File[] } = {};
  imagePreviewUrls: { [serialNo: number]: string[] } = {};

  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  // =========================
  // 類別下拉選單
  // =========================
  categoryDropdownIndex: number | null = null;

  categoryOptions: NonNullable<EditableDailyDemand['category']>[] = [
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
    private service: DailyDemandService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // 初始化
  // =========================
  ngOnInit() {
    const data = localStorage.getItem('editDemands');

    if (data) {
      this.editDemands = JSON.parse(data).map((item: any) => ({
        ...item,

        // =========================
        // 服務對象
        // =========================
        // 資料庫現在使用陣列：
        // ['老人', '孩童', '貧困']
        //
        // 如果舊資料還是物件格式，這裡也會轉成陣列，
        // 避免舊的 localStorage 資料造成錯誤。
        serviceTargets: this.convertServiceTargets(item.serviceTargets),

        customServiceTargets: item.customServiceTargets?.length ? item.customServiceTargets : [''],

        // =========================
        // 接受物資狀態
        // =========================
        conditions: item.conditions || {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        },

        customConditions: item.customConditions?.length ? item.customConditions : [''],

        // =========================
        // 基本資料
        // =========================
        unit: item.unit || '',
        amountDescription: item.amountDescription || '',
        status: item.status ?? '隱藏',
        remaining: item.remaining ?? item.amount,
        createdAt: item.createdAt,
        brand: item.brand || '',
        category: item.category || '',

        // =========================
        // 接收方式
        // =========================
        receiveMethod: item.receiveMethod || {
          寄送: true,
          面交: false,
        },

        recipient: item.recipient ?? '',
        address: item.address ?? '',
        phone: item.phone ?? '',

        // =========================
        // 聯絡時間：日期
        // =========================
        contactTimeWeekday: item.contactTimeWeekday ?? false,
        contactTimeWeekend: item.contactTimeWeekend ?? false,

        // =========================
        // 聯絡時間：共用時段
        // =========================
        contactTimeMorning: item.contactTimeMorning ?? false,
        contactTimeAfternoon: item.contactTimeAfternoon ?? false,
        contactTimeEvening: item.contactTimeEvening ?? false,

        // =========================
        // 是否分開設定平日、假日
        // =========================
        contactTimeSeparate: item.contactTimeSeparate ?? false,

        // =========================
        // 平日時段
        // =========================
        contactTimeWeekdayMorning: item.contactTimeWeekdayMorning ?? false,
        contactTimeWeekdayAfternoon: item.contactTimeWeekdayAfternoon ?? false,
        contactTimeWeekdayEvening: item.contactTimeWeekdayEvening ?? false,

        // =========================
        // 假日時段
        // =========================
        contactTimeWeekendMorning: item.contactTimeWeekendMorning ?? false,
        contactTimeWeekendAfternoon: item.contactTimeWeekendAfternoon ?? false,
        contactTimeWeekendEvening: item.contactTimeWeekendEvening ?? false,

        // =========================
        // 資料庫整合欄位
        // =========================
        serviceTargetDescription: item.serviceTargetDescription ?? '',

        conditionDescription: item.conditionDescription ?? '',
      }));

      // =========================
      // 載入圖片
      // =========================
      this.editDemands.forEach((item) => {
        this.imageFiles[item.serialNo] = [];

        Promise.all(
          (item.image ?? []).map((image: string, index: number) => {
            const fileName = item.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

            return this.base64ToFile(image, fileName);
          })
        ).then((files) => {
          this.imageFiles[item.serialNo] = files;

          // 建立圖片預覽 URL
          this.imagePreviewUrls[item.serialNo] = files.map((file) => URL.createObjectURL(file));

          this.cdr.detectChanges();
        });
      });
    }

    console.log('批次修改資料:', this.editDemands);
  }

  // =========================================================
  // 將需求對象轉換成資料庫使用的陣列
  // =========================================================
  convertServiceTargets(serviceTargets: any): string[] {
    // 已經是陣列
    if (Array.isArray(serviceTargets)) {
      return serviceTargets.filter((target) => typeof target === 'string' && target.trim() !== '');
    }

    // 舊資料如果還是：
    // {
    //   老人: true,
    //   嬰幼兒: false,
    //   孩童: true
    // }
    //
    // 就轉換成：
    // ['老人', '孩童']
    if (serviceTargets && typeof serviceTargets === 'object') {
      return Object.entries(serviceTargets)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
    }

    // 沒有資料
    return [];
  }

  // =========================================================
  // 判斷需求對象是否已勾選
  // =========================================================
  isServiceTargetSelected(demand: EditableDailyDemand, target: string): boolean {
    return Array.isArray(demand.serviceTargets) && demand.serviceTargets.includes(target);
  }

  // =========================================================
  // 切換需求對象
  //
  // 勾選 → 加入陣列
  // 取消 → 從陣列移除
  // =========================================================
  toggleServiceTarget(demand: EditableDailyDemand, target: string): void {
    if (!Array.isArray(demand.serviceTargets)) {
      demand.serviceTargets = [];
    }

    const index = demand.serviceTargets.indexOf(target);

    if (index === -1) {
      // 尚未選擇 → 加入
      demand.serviceTargets.push(target);
    } else {
      // 已經選擇 → 移除
      demand.serviceTargets.splice(index, 1);
    }

    // 有選擇需求對象後，移除錯誤狀態
    if (demand.serviceTargets.length > 0) {
      demand.serviceTargetError = false;
    }
  }

  // =========================
  // Base64 → File
  // =========================
  async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: blob.type,
    });
  }

  // =========================
  // File → Base64
  // =========================
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      reader.readAsDataURL(file);
    });
  }

  // =========================
  // 圖片選擇
  // =========================
  onImageSelected(event: Event, demand: EditableDailyDemand) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    if (!this.imageFiles[demand.serialNo]) {
      this.imageFiles[demand.serialNo] = [];
    }

    const file = input.files[0];

    // 最多 5 張
    if (this.imageFiles[demand.serialNo].length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    // 最大 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    this.imageFiles[demand.serialNo].push(file);

    if (!this.imagePreviewUrls[demand.serialNo]) {
      this.imagePreviewUrls[demand.serialNo] = [];
    }

    this.imagePreviewUrls[demand.serialNo].push(URL.createObjectURL(file));

    input.value = '';
  }

  // =========================
  // 移除圖片
  // =========================
  removeImage(demand: EditableDailyDemand, index: number) {
    const urls = this.imagePreviewUrls[demand.serialNo];

    if (urls?.[index]) {
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
    }

    if (this.imageFiles[demand.serialNo]) {
      this.imageFiles[demand.serialNo].splice(index, 1);
    }
  }

  // =========================
  // 剩餘需求數量限制
  // =========================
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

  // =========================
  // 數字欄位限制
  // =========================
  limitNumberLength(event: Event, demand: any, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    // 只允許數字
    input.value = input.value.replace(/[^0-9]/g, '');

    // 最多 10 位
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    // 需求數量
    if (field === 'amount') {
      demand.amount = value;

      // 需求數量變更時，剩餘需求同步更新
      demand.remaining = value;
    }

    // 剩餘需求
    if (field === 'remaining') {
      if (value !== null && demand.amount !== null && value > demand.amount) {
        demand.remaining = demand.amount;
        input.value = demand.amount.toString();
      } else {
        demand.remaining = value;
      }
    }
  }

  // =========================
  // 一般文字欄位限制
  // =========================
  limitTextLength(event: Event, demand: any, field: string, maxLength: number): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    demand[field] = input.value;
  }

  // =========================
  // 陣列文字欄位限制
  // =========================
  limitArrayTextLength(event: Event, array: string[], index: number, maxLength: number): void {
    const input = event.target as HTMLInputElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    array[index] = input.value;
  }

  // =========================
  // 圖片預覽
  // =========================
  openImagePreview(demand: EditableDailyDemand, index: number): void {
    const files = this.imageFiles[demand.serialNo] || [];

    const previewUrls = this.imagePreviewUrls[demand.serialNo] || [];

    const file = files[index];
    const previewUrl = previewUrls[index];

    if (!file || !previewUrl) {
      return;
    }

    this.previewImage = previewUrl;
    this.previewImageName = file.name;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }

  // =========================================================
  // 整合需求對象
  //
  // 固定需求對象陣列 + 其他自訂需求對象
  // =========================================================
  buildServiceTargetDescription(demand: EditableDailyDemand): string {
    const targets: string[] = [];

    // 固定需求對象
    (demand.serviceTargets || []).forEach((target) => {
      if (target && target.trim()) {
        targets.push(`${target}✓`);
      }
    });

    // 自訂需求對象
    (demand.customServiceTargets || []).forEach((target) => {
      const value = target.trim();

      if (value) {
        targets.push(value);
      }
    });

    return targets.join('、');
  }

  // =========================================================
  // 整合物資需求狀態
  //
  // 固定物資狀態 + 其他自訂物資狀態
  // =========================================================
  buildConditionDescription(demand: EditableDailyDemand): string {
    const conditions = [
      {
        name: '全新',
        value: demand.conditions?.全新,
      },
      {
        name: '二手',
        value: demand.conditions?.二手,
      },
      {
        name: '有擦痕',
        value: demand.conditions?.有擦痕,
      },
      {
        name: '過期',
        value: demand.conditions?.過期,
      },
      {
        name: '毀損',
        value: demand.conditions?.毀損,
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

    (demand.customConditions || []).forEach((condition) => {
      const value = condition.trim();

      if (value) {
        result.push(value);
      }
    });

    return result.join('、');
  }

  // =========================
  // 批次儲存
  // =========================
  async saveAll() {
    // =========================
    // 第一階段：驗證所有資料
    // =========================
    this.editDemands.forEach((item) => {
      item.itemError = false;
      item.amountError = false;
      item.unitError = false;
      item.reasonError = false;
      item.descriptionError = false;
      item.phoneError = false;
      item.remainingError = false;
      item.categoryError = false;
      item.serviceTargetError = false;
      item.invalidReceiveInfo = false;

      // 物資名稱
      if (!item.item) {
        item.itemError = true;
      }

      // 需求數量
      if (!item.amount || isNaN(Number(item.amount))) {
        item.amountError = true;
      }

      // 單位
      if (!item.unit || !item.unit.trim()) {
        item.unitError = true;
      }

      // 剩餘需求
      if (item.remaining === undefined || item.remaining === null) {
        item.remainingError = true;
      }

      if (Number(item.remaining) < 0) {
        item.remainingError = true;
      }

      // 需求原因
      if (!item.reason) {
        item.reasonError = true;
      }

      // 需求說明
      if (!item.description) {
        item.descriptionError = true;
      }

      // 類別
      if (!item.category) {
        item.categoryError = true;
      }

      // =========================
      // 接收方式
      // =========================
      const hasReceiveMethod = item.receiveMethod?.寄送 || item.receiveMethod?.面交;

      if (!hasReceiveMethod || !item.recipient || !item.address) {
        item.invalidReceiveInfo = true;
      }

      // =========================
      // 聯絡電話
      // =========================
      if (!item.phone) {
        item.phoneError = true;
      }

      // =========================
      // 服務對象
      // =========================
      const hasServiceTarget =
        (Array.isArray(item.serviceTargets) && item.serviceTargets.length > 0) ||
        item.customServiceTargets?.some((target: string) => target.trim() !== '');

      if (!hasServiceTarget) {
        item.serviceTargetError = true;
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
        item.phoneError ||
        item.remainingError ||
        item.serviceTargetError ||
        item.invalidReceiveInfo
    );

    if (invalid) {
      this.scrollToFirstError();
      return;
    }

    // =========================
    // 初始化 conditions
    // =========================
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
    });

    // =========================
    // 開始儲存
    // =========================
    for (const item of this.editDemands) {
      // =========================
      // 清除空白自訂欄位
      // =========================
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

      item.customServiceTargets = item.customServiceTargets.filter((target) => target.trim() !== '');

      // 至少保留一個輸入框
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }

      if (item.customServiceTargets.length === 0) {
        item.customServiceTargets.push('');
      }

      // =========================
      // 確保需求對象為陣列
      // =========================
      if (!Array.isArray(item.serviceTargets)) {
        item.serviceTargets = [];
      }

      // =========================
      // 建立資料庫使用的合併欄位
      // =========================
      item.serviceTargetDescription = this.buildServiceTargetDescription(item);

      item.conditionDescription = this.buildConditionDescription(item);

      // =========================
      // 建立日期
      // =========================
      if ((item.status === '上架' || item.status === '下架') && !item.createdAt) {
        item.createdAt = new Date().toISOString();
      }

      // =========================
      // 隱藏 = 尚未發布
      // =========================
      if (item.status === '隱藏') {
        item.createdAt = undefined;
      }

      // =========================
      // 儲存圖片
      // =========================
      const files = this.imageFiles[item.serialNo] || [];

      item.image = [];
      item.imageFileNames = [];

      for (const file of files) {
        const base64 = await this.fileToBase64(file);

        item.image.push(base64);
        item.imageFileNames.push(file.name);
      }

      // =========================
      // 更新 Service
      // =========================
      this.service.updateDemand(item);
    }

    // =========================
    // 清除批次編輯暫存
    // =========================
    localStorage.removeItem('editDemands');

    // =========================
    // 返回日常需求列表
    // =========================
    this.router.navigate(['/agency/daily']);
  }

  // =========================
  // 滾動到第一個錯誤
  // =========================
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

  // =========================
  // 其他服務對象：新增
  // =========================
  addCustomServiceTarget(demand: EditableDailyDemand) {
    if (demand.customServiceTargets.length < 5) {
      demand.customServiceTargets.push('');
    }
  }

  // =========================
  // 其他服務對象：刪除
  // =========================
  removeCustomServiceTarget(demand: EditableDailyDemand, index: number) {
    if (demand.customServiceTargets.length > 1) {
      demand.customServiceTargets.splice(index, 1);
    }
  }

  // =========================
  // 接受物資狀態切換
  // =========================
  toggleCondition(demand: EditableDailyDemand, key: keyof EditableDailyDemand['conditions']) {
    const current = demand.conditions[key];

    if (current === '') {
      demand.conditions[key] = '接受';
    } else if (current === '接受') {
      demand.conditions[key] = '不接受';
    } else {
      demand.conditions[key] = '';
    }
  }

  // =========================
  // 顯示接受物資狀態圖示
  // =========================
  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  // =========================
  // 其他物品狀態：新增
  // =========================
  addCustomCondition(demand: EditableDailyDemand) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  // =========================
  // 其他物品狀態：刪除
  // =========================
  removeCustomCondition(demand: EditableDailyDemand, index: number) {
    if (demand.customConditions.length > 1) {
      demand.customConditions.splice(index, 1);
    }
  }

  // =========================
  // 類別下拉選單
  // =========================
  toggleCategoryDropdown(index: number): void {
    this.categoryDropdownIndex = this.categoryDropdownIndex === index ? null : index;
  }

  // =========================
  // 選擇類別
  // =========================
  selectCategory(demand: EditableDailyDemand, category: NonNullable<EditableDailyDemand['category']>): void {
    demand.category = category;
    demand.categoryError = false;
    this.categoryDropdownIndex = null;
  }

  // =========================
  // TrackBy
  // =========================
  trackByIndex(index: number): number {
    return index;
  }

  // =========================
  // 取消批次編輯
  // =========================
  cancel() {
    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/daily']);
  }
}
