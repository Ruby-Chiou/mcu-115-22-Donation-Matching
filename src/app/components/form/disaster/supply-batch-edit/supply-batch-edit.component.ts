import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { EditableDisasterDemand } from '../../../../models/agency/disaster-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

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
    private router: Router,
    private http: HttpClient
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

        // 經緯度
        latitude: item.latitude,
        longitude: item.longitude,

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

  // =========================================================
  // 地址轉換成經緯度
  // =========================================================
  async getCoordinatesFromAddress(address: string, demand: EditableDisasterDemand): Promise<boolean> {
    const url = 'https://nominatim.openstreetmap.org/search';

    const params = {
      // 原本的城市 / 國家寫法保持不變
      q: `${address}, Taiwan`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'tw',
    };

    try {
      const results = await firstValueFrom(this.http.get<NominatimSearchResult[]>(url, { params }));

      // 沒有找到地址
      if (!results || results.length === 0) {
        return false;
      }

      const result = results[0];

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      // 檢查經緯度是否為有效數字
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      // 寫回目前正在批次編輯的資料
      demand.latitude = latitude;
      demand.longitude = longitude;

      console.log('地址：', address.trim());
      console.log('轉換後緯度：', demand.latitude);
      console.log('轉換後經度：', demand.longitude);
      console.log('Nominatim 找到的位置：', result.display_name);

      return true;
    } catch (error) {
      console.error('地址轉換經緯度失敗：', error);

      return false;
    }
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

  // 判斷目前需求是否為手動下架
  isManualOffShelf(demand: EditableDisasterDemand): boolean {
    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);

    const originalStatus = originalItem?.status ?? demand.status;

    const originalOffShelfReason = originalItem?.offShelfReason;

    return originalStatus === '下架' && originalOffShelfReason === 'manual';
  }

  // 點擊公開狀態
  onStatusClick(event: MouseEvent, demand: EditableDisasterDemand, newStatus: EditableDisasterDemand['status']): void {
    // 手動下架的需求不能重新上架
    if (newStatus === '上架' && this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();

      // 強制維持下架
      demand.status = '下架';
      demand.offShelfReason = 'manual';

      // 記錄目前正在處理的資料
      this.pendingStatusDemand = demand;

      // 顯示無法重新上架 Modal
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(demand, newStatus);
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

    // 手動下架永遠維持下架
    demand.status = '下架';
    demand.offShelfReason = 'manual';
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

    // 有選取文字時允許輸入
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

  // =========================================================
  // 儲存全部資料
  // =========================================================
  async saveAll(): Promise<void> {
    try {
      // 儲存每一筆資料
      for (const item of this.editDemands) {
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

        // ===================================================
        // 處理上架狀態
        // ===================================================
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

            continue;
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

        // ===================================================
        // 處理隱藏狀態
        // ===================================================
        else if (item.status === '隱藏') {
          item.publishedAt = undefined;
          item.expectedOffShelfAt = undefined;
          item.offShelfReason = undefined;
        }

        // ===================================================
        // 處理下架狀態
        // ===================================================
        else if (item.status === '下架') {
          if (!item.offShelfReason) {
            item.offShelfReason = 'manual';
          }

          // 保留原本上架日期
          if (originalPublishedAt) {
            item.publishedAt = originalPublishedAt;
          }

          // 沒有下架時間才新增
          if (!item.expectedOffShelfAt) {
            item.expectedOffShelfAt = now.toISOString();
          }
        }

        // ===================================================
        // 地址 → 經緯度
        // ===================================================
        const addressSuccess = await this.getCoordinatesFromAddress(item.address, item);

        // 地址找不到就不儲存這一筆
        if (!addressSuccess) {
          alert(`需求編號 ${item.serialNo} 的地址無法找到位置，請確認地址是否正確。`);
          return;
        }

        console.log(`需求編號 ${item.serialNo} 經緯度：`, item.latitude, item.longitude);

        // ===================================================
        // 更新 Service (等待確實寫入 Supabase)
        // ===================================================
        await this.service.updateDemand(item);
      }

      // 全部資料成功更新後，才清除暫存
      localStorage.removeItem('editDemands');

      // 所有更新完成後才返回災害需求列表
      await this.router.navigate(['/agency/disaster'], {
        queryParams: {
          refresh: Date.now(),
        },
      });
    } catch (error) {
      console.error('批次修改災害物資需求失敗：', error);
      alert('批次修改失敗，請確認網路、Supabase 權限或資料格式。');
    }
  }

  // 依照優先度計算預計下架日期
  calculateExpectedOffShelfDate(publishedDate: Date, priority?: string): string | undefined {
    if (!publishedDate || isNaN(publishedDate.getTime())) {
      return undefined;
    }

    const daysToAdd = priority === '緊急' ? 3 : 7; // 範例：緊急優先度 3 天，一般 7 天（可依你的業務邏輯調整）
    const offShelfDate = new Date(publishedDate);
    offShelfDate.setDate(offShelfDate.getDate() + daysToAdd);

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
  // 切換勾選狀態 (例如: 全新、二手、有擦痕、過期、毀損)
  toggleCondition(demand: any, conditionKey: string): void {
    if (!demand.conditions) {
      demand.conditions = {};
    }
    // 假設狀態是在 boolean 之間切換
    demand.conditions[conditionKey] = !demand.conditions[conditionKey];
  }

  // 取得狀態對應的圖示或顯示符號
  // 取得狀態對應的圖示或顯示符號
  getConditionIcon(value: any): string {
    return value ? '✔' : '';
  }

  // 新增自訂條件
  addCustomCondition(demand: any): void {
    if (!demand.customConditions) {
      demand.customConditions = [];
    }
    // 預設新增一筆空白或提示字串，依你的表單互動為主
    demand.customConditions.push('');
  }

  // 移除自訂條件
  removeCustomCondition(demand: any, index: number): void {
    if (demand && demand.customConditions) {
      demand.customConditions.splice(index, 1);
    }
  }
}
