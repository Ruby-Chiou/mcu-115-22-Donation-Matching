import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { EditableDailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-daily-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
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

  private originalStatusMap: {
    [serialNo: number]: EditableDailyDemand['status'];
  } = {};

  private originalOffShelfReasonMap: {
    [serialNo: number]: EditableDailyDemand['offShelfReason'] | undefined;
  } = {};

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  pendingDemand: EditableDailyDemand | null = null;

  imageFiles: {
    [serialNo: number]: File[];
  } = {};

  imagePreviewUrls: {
    [serialNo: number]: string[];
  } = {};

  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

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
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const data = localStorage.getItem('editDemands');

    if (data) {
      this.editDemands = JSON.parse(data).map((item: any) => ({
        ...item,

        serviceTargets: this.convertServiceTargets(item.serviceTargets),

        customServiceTargets: item.customServiceTargets?.length ? item.customServiceTargets : [''],

        conditions: item.conditions || {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        },

        customConditions: item.customConditions?.length ? item.customConditions : [''],

        unit: item.unit || '',
        amountDescription: item.amountDescription || '',
        status: item.status ?? '隱藏',
        remaining: item.remaining ?? item.amount,
        createdAt: item.createdAt,
        brand: item.brand || '',
        category: item.category || '',

        receiveMethod: item.receiveMethod || {
          寄送: true,
          面交: false,
        },

        recipient: item.recipient ?? '',
        address: item.address ?? '',
        latitude: item.latitude,
        longitude: item.longitude,
        phone: item.phone ?? '',

        contactTimeWeekday: item.contactTimeWeekday ?? false,
        contactTimeWeekend: item.contactTimeWeekend ?? false,

        contactTimeMorning: item.contactTimeMorning ?? false,
        contactTimeAfternoon: item.contactTimeAfternoon ?? false,
        contactTimeEvening: item.contactTimeEvening ?? false,

        contactTimeSeparate: item.contactTimeSeparate ?? false,

        contactTimeWeekdayMorning: item.contactTimeWeekdayMorning ?? false,
        contactTimeWeekdayAfternoon: item.contactTimeWeekdayAfternoon ?? false,
        contactTimeWeekdayEvening: item.contactTimeWeekdayEvening ?? false,

        contactTimeWeekendMorning: item.contactTimeWeekendMorning ?? false,
        contactTimeWeekendAfternoon: item.contactTimeWeekendAfternoon ?? false,
        contactTimeWeekendEvening: item.contactTimeWeekendEvening ?? false,

        serviceTargetDescription: item.serviceTargetDescription ?? '',

        conditionDescription: item.conditionDescription ?? '',
      }));

      this.editDemands.forEach((item) => {
        this.originalStatusMap[item.serialNo] = item.status ?? '隱藏';

        this.originalOffShelfReasonMap[item.serialNo] = item.offShelfReason;
      });

      this.editDemands.forEach((item) => {
        this.imageFiles[item.serialNo] = [];

        Promise.all(
          (item.image ?? []).map((image: string, index: number) => {
            const fileName = item.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

            return this.base64ToFile(image, fileName);
          })
        ).then((files) => {
          this.imageFiles[item.serialNo] = files;

          this.imagePreviewUrls[item.serialNo] = files.map((file) => URL.createObjectURL(file));

          this.cdr.detectChanges();
        });
      });
    }

    console.log('批次修改資料:', this.editDemands);
  }

  // =========================================================
  // 從完整地址取得道路名稱
  // =========================================================
  private extractRoadName(address: string): string {
    let roadAddress = address.trim().replace(/臺/g, '台').replace(/\s+/g, '');

    // 移除縣市名稱
    roadAddress = roadAddress.replace(/^.*?[市縣]/, '');

    // 移除區、鄉、鎮、縣轄市名稱
    roadAddress = roadAddress.replace(/^.*?[區鄉鎮市]/, '');

    // 移除門牌號碼及後面的內容
    roadAddress = roadAddress.replace(/\d+(?:-\d+)?(?:之\d+)?號.*$/, '');

    return roadAddress.trim();
  }

  // =========================================================
  // 地址 → 經緯度
  // =========================================================
  async getCoordinatesFromAddress(address: string, demand: EditableDailyDemand): Promise<boolean> {
    const url = 'https://nominatim.openstreetmap.org/search';

    const originalAddress = address.trim();

    // =========================================================
    // 第一階段：先搜尋完整地址
    // =========================================================
    const searchAddresses: string[] = [
      originalAddress,
      originalAddress.replace(/臺/g, '台'),
      originalAddress.replace(/號$/, ''),
      originalAddress.replace(/臺/g, '台').replace(/號$/, ''),
      originalAddress.replace(/\s+/g, ''),
      originalAddress.replace(/臺/g, '台').replace(/\s+/g, ''),
      originalAddress.replace(/臺/g, '台').replace(/號$/, '').replace(/\s+/g, ''),
    ];

    const uniqueAddresses = [...new Set(searchAddresses.filter((item) => item.length > 0))];

    console.log(`需求 A${demand.serialNo} Nominatim 將先嘗試搜尋完整地址：`, uniqueAddresses);

    for (const searchAddress of uniqueAddresses) {
      const params = {
        // 原城市碼／台灣設定維持不變
        q: `${searchAddress}, Taiwan`,
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'tw',
      };

      try {
        console.log(`需求 A${demand.serialNo} 搜尋完整地址：`, searchAddress);

        const results = await firstValueFrom(this.http.get<NominatimSearchResult[]>(url, { params }));

        console.log(`需求 A${demand.serialNo} Nominatim 回傳結果：`, results);

        if (!results || results.length === 0) {
          continue;
        }

        const result = results[0];

        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          console.warn(`需求 A${demand.serialNo} 完整地址回傳的經緯度無效：`, result);

          continue;
        }

        // 寫回目前批次編輯的資料
        demand.latitude = latitude;
        demand.longitude = longitude;

        console.log('--------------------------------');
        console.log(`需求 A${demand.serialNo} Nominatim 完整地址搜尋成功`);
        console.log('原始地址：', address);
        console.log('成功搜尋：', searchAddress);
        console.log('轉換後緯度：', latitude);
        console.log('轉換後經度：', longitude);
        console.log('Nominatim 找到的位置：', result.display_name);
        console.log('--------------------------------');

        return true;
      } catch (error) {
        console.error(`需求 A${demand.serialNo} Nominatim 搜尋完整地址失敗：${searchAddress}`, error);

        // 繼續嘗試下一種完整地址格式
        continue;
      }
    }

    // =========================================================
    // 第二階段：完整地址找不到 → 搜尋道路名稱
    // =========================================================
    const roadAddress = this.extractRoadName(originalAddress);

    if (!roadAddress) {
      console.warn(`需求 A${demand.serialNo} 無法從地址取得道路名稱：`, originalAddress);

      return false;
    }

    console.log(`需求 A${demand.serialNo} 完整地址全部找不到，改搜尋道路名稱：`, roadAddress);

    const roadParams = {
      // 原城市碼／台灣設定維持不變
      q: `${roadAddress}, Taiwan`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'tw',
    };

    try {
      const roadResults = await firstValueFrom(this.http.get<NominatimSearchResult[]>(url, { params: roadParams }));

      console.log(`需求 A${demand.serialNo} Nominatim 道路搜尋結果：`, roadResults);

      if (!roadResults || roadResults.length === 0) {
        console.warn(`需求 A${demand.serialNo} 道路名稱也找不到：`, roadAddress);

        return false;
      }

      const roadResult = roadResults[0];

      const latitude = Number(roadResult.lat);
      const longitude = Number(roadResult.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.warn(`需求 A${demand.serialNo} 道路回傳的經緯度無效：`, roadResult);

        return false;
      }

      // 將道路座標寫入目前批次編輯資料
      demand.latitude = latitude;
      demand.longitude = longitude;

      console.log('--------------------------------');
      console.log(`需求 A${demand.serialNo} Nominatim 道路搜尋成功`);
      console.log('原始地址：', address);
      console.log('道路名稱：', roadAddress);
      console.log('道路座標緯度：', latitude);
      console.log('道路座標經度：', longitude);
      console.log('Nominatim 找到的位置：', roadResult.display_name);
      console.log('--------------------------------');

      return true;
    } catch (error) {
      console.error(`需求 A${demand.serialNo} Nominatim 道路搜尋失敗：${roadAddress}`, error);

      return false;
    }
  }

  // =========================================================
  // 以下保留原本功能
  // =========================================================

  isManualOffShelf(demand: EditableDailyDemand): boolean {
    return demand.status === '下架' && demand.offShelfReason === 'manual';
  }

  onStatusClick(event: MouseEvent, demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    if (newStatus === '上架' && this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();

      demand.status = '下架';

      this.pendingDemand = demand;
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(demand, newStatus);
  }

  onStatusSelect(demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    const wasManualOffShelf =
      this.originalStatusMap[demand.serialNo] === '下架' && this.originalOffShelfReasonMap[demand.serialNo] === 'manual';

    const currentlyManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        demand.status = '下架';

        this.pendingDemand = demand;
        this.showOnShelfWarning = true;

        return;
      }

      demand.status = '下架';
      return;
    }

    if (newStatus === '上架') {
      demand.status = '上架';
      return;
    }

    if (newStatus === '隱藏') {
      demand.status = '隱藏';

      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;

      return;
    }

    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }

      this.pendingDemand = demand;

      demand.status = this.originalStatusMap[demand.serialNo] ?? '隱藏';

      this.showOffShelfWarning = true;
      return;
    }
  }

  cancelManualOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    demand.status = this.originalStatusMap[demand.serialNo] ?? '隱藏';

    demand.offShelfReason = this.originalOffShelfReasonMap[demand.serialNo];

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  hideInsteadOfOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    demand.status = '隱藏';

    demand.publishedAt = undefined;
    demand.expectedOffShelfAt = undefined;
    demand.offShelfReason = undefined;

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  confirmManualOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    const now = new Date();

    demand.status = '下架';
    demand.offShelfReason = 'manual';
    demand.expectedOffShelfAt = now.toISOString();

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.pendingDemand) {
      this.pendingDemand.status = '下架';

      this.pendingDemand.offShelfReason = 'manual';
    }

    this.pendingDemand = null;
  }

  convertServiceTargets(serviceTargets: any): string[] {
    if (Array.isArray(serviceTargets)) {
      return serviceTargets.filter((target) => typeof target === 'string' && target.trim() !== '');
    }

    if (serviceTargets && typeof serviceTargets === 'object') {
      return Object.entries(serviceTargets)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
    }

    return [];
  }

  isServiceTargetSelected(demand: EditableDailyDemand, target: string): boolean {
    return Array.isArray(demand.serviceTargets) && demand.serviceTargets.includes(target);
  }

  toggleServiceTarget(demand: EditableDailyDemand, target: string): void {
    if (!Array.isArray(demand.serviceTargets)) {
      demand.serviceTargets = [];
    }

    const index = demand.serviceTargets.indexOf(target);

    if (index === -1) {
      demand.serviceTargets.push(target);
    } else {
      demand.serviceTargets.splice(index, 1);
    }

    if (demand.serviceTargets.length > 0) {
      demand.serviceTargetError = false;
    }
  }

  async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: blob.type,
    });
  }

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

  onImageSelected(event: Event, demand: EditableDailyDemand) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    if (!this.imageFiles[demand.serialNo]) {
      this.imageFiles[demand.serialNo] = [];
    }

    const file = input.files[0];

    if (this.imageFiles[demand.serialNo].length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

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

  limitTextLength(event: Event, demand: any, field: string, maxLength: number): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    demand[field] = input.value;
  }

  limitArrayTextLength(event: Event, array: string[], index: number, maxLength: number): void {
    const input = event.target as HTMLInputElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    array[index] = input.value;
  }

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

  buildServiceTargetDescription(demand: EditableDailyDemand): string {
    const targets: string[] = [];

    (demand.serviceTargets || []).forEach((target) => {
      if (target && target.trim()) {
        targets.push(`${target}✓`);
      }
    });

    (demand.customServiceTargets || []).forEach((target) => {
      const value = target.trim();

      if (value) {
        targets.push(value);
      }
    });

    return targets.join('、');
  }

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

  calculateExpectedOffShelfDate(publishedDate: Date, priority: EditableDailyDemand['priority']): string {
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
  // 批次儲存
  // =========================================================
  async saveAll() {
    // 第一階段：驗證所有資料
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

      const hasReceiveMethod = item.receiveMethod?.寄送 || item.receiveMethod?.面交;

      if (!hasReceiveMethod || !item.recipient || !item.address) {
        item.invalidReceiveInfo = true;
      }

      if (!item.phone) {
        item.phoneError = true;
      }

      const hasServiceTarget =
        (Array.isArray(item.serviceTargets) && item.serviceTargets.length > 0) ||
        item.customServiceTargets?.some((target: string) => target.trim() !== '');

      if (!hasServiceTarget) {
        item.serviceTargetError = true;
      }
    });

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

    const invalidManualOffShelf = this.editDemands.find((item) => {
      const originalStatus = this.originalStatusMap[item.serialNo];

      const originalOffShelfReason = this.originalOffShelfReasonMap[item.serialNo];

      const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

      const isCurrentManualOffShelf = item.status === '下架' && item.offShelfReason === 'manual';

      return item.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf);
    });

    if (invalidManualOffShelf) {
      alert(`需求 A${invalidManualOffShelf.serialNo} 為使用者主動下架，無法重新上架。`);

      invalidManualOffShelf.status = '下架';

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
    });

    // =========================================================
    // 開始儲存
    // =========================================================
    for (const item of this.editDemands) {
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

      item.customServiceTargets = item.customServiceTargets.filter((target) => target.trim() !== '');

      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }

      if (item.customServiceTargets.length === 0) {
        item.customServiceTargets.push('');
      }

      if (!Array.isArray(item.serviceTargets)) {
        item.serviceTargets = [];
      }

      item.serviceTargetDescription = this.buildServiceTargetDescription(item);

      item.conditionDescription = this.buildConditionDescription(item);

      const originalStatus = this.originalStatusMap[item.serialNo] ?? item.status;

      const originalOffShelfReason = this.originalOffShelfReasonMap[item.serialNo];

      const now = new Date();

      const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

      const isCurrentManualOffShelf = item.status === '下架' && item.offShelfReason === 'manual';

      if (item.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
        alert(`需求 A${item.serialNo} 為使用者主動下架，無法重新上架。`);

        item.status = '下架';

        return;
      }

      if (item.status === '上架') {
        if (originalStatus !== '上架') {
          item.publishedAt = now.toISOString();

          if (!item.createdAt) {
            item.createdAt = now.toISOString();
          }
        } else if (item.publishedAt) {
          item.publishedAt = item.publishedAt;
        }

        if (!item.createdAt) {
          item.createdAt = now.toISOString();
        }

        if (item.publishedAt) {
          item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
        }

        item.offShelfReason = undefined;
      } else if (item.status === '隱藏') {
        item.publishedAt = undefined;
        item.expectedOffShelfAt = undefined;
        item.offShelfReason = undefined;
      } else if (item.status === '下架') {
        if (!item.offShelfReason) {
          item.offShelfReason = 'manual';
        }

        if (!item.expectedOffShelfAt) {
          item.expectedOffShelfAt = now.toISOString();
        }
      }

      // =====================================================
      // 地址 → 經緯度
      // =====================================================
      const addressSuccess = await this.getCoordinatesFromAddress(item.address, item);

      if (!addressSuccess) {
        alert(`需求 A${item.serialNo} 的地址無法找到位置，請確認地址是否正確。`);

        return;
      }

      console.log(`需求 A${item.serialNo} 經緯度：`, item.latitude, item.longitude);

      // =====================================================
      // 儲存圖片
      // =====================================================
      const files = this.imageFiles[item.serialNo] || [];

      item.image = [];
      item.imageFileNames = [];

      for (const file of files) {
        const base64 = await this.fileToBase64(file);

        item.image.push(base64);
        item.imageFileNames.push(file.name);
      }

      // =====================================================
      // 更新 Service
      // =====================================================
      this.service.updateDemand(item);
    }

    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/daily']);
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

  addCustomServiceTarget(demand: EditableDailyDemand) {
    if (demand.customServiceTargets.length < 5) {
      demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(demand: EditableDailyDemand, index: number) {
    if (demand.customServiceTargets.length > 1) {
      demand.customServiceTargets.splice(index, 1);
    }
  }

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

  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  addCustomCondition(demand: EditableDailyDemand) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: EditableDailyDemand, index: number) {
    if (demand.customConditions.length > 1) {
      demand.customConditions.splice(index, 1);
    }
  }

  toggleCategoryDropdown(index: number): void {
    this.categoryDropdownIndex = this.categoryDropdownIndex === index ? null : index;
  }

  selectCategory(demand: EditableDailyDemand, category: NonNullable<EditableDailyDemand['category']>): void {
    demand.category = category;
    demand.categoryError = false;
    this.categoryDropdownIndex = null;
  }

  trackByIndex(index: number): number {
    return index;
  }

  cancel() {
    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/daily']);
  }
}
