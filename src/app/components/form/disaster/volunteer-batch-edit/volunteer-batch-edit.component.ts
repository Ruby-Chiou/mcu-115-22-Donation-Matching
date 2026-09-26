import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';
import { VolunteerOffShelfComponent } from '../../../modal/shelf/volunteer-off-shelf/volunteer-off-shelf.component';
import { VolunteerOnShelfComponent } from '../../../modal/shelf/volunteer-on-shelf/volunteer-on-shelf.component';

// Nominatim 回傳資料格式
interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

// 讓元件專用的 UI 表單介面繼承原始的 VolunteerDemand，並擴充驗證屬性
export type VolunteerDemandItem = VolunteerDemand & {
  selected?: boolean;
  typeError?: boolean;
  peopleError?: boolean;
  locationError?: boolean;
  conditionError?: boolean;
  workContentError?: boolean;
  reasonError?: boolean;
  contactError?: boolean;
  phoneError?: boolean;
};

@Component({
  selector: 'app-volunteer-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, VolunteerOffShelfComponent, VolunteerOnShelfComponent],
  templateUrl: './volunteer-batch-edit.component.html',
  styleUrl: './volunteer-batch-edit.component.scss',
})
export class VolunteerBatchEditComponent implements OnInit {
  editDemands: VolunteerDemandItem[] = [];

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  private pendingDemand: VolunteerDemandItem | null = null;

  constructor(
    private volunteerDemandService: VolunteerDemandService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDataFromService();
  }

  // ==========================================
  // 地址轉換成經緯度
  // ==========================================

  async getCoordinatesFromAddress(location: string, demand: VolunteerDemandItem): Promise<boolean> {
    const url = 'https://nominatim.openstreetmap.org/search';

    // ==========================================
    // 第一步：搜尋完整地址
    // ==========================================

    const searchAddress = location.trim();

    const params = {
      // 原本城市碼／台灣設定維持不變
      q: `${searchAddress}, Taiwan`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'tw',
    };

    try {
      let results = await firstValueFrom(this.http.get<NominatimSearchResult[]>(url, { params }));

      // ==========================================
      // 完整地址找不到
      // → 第二步：改搜尋道路名稱
      // ==========================================

      if (!results || results.length === 0) {
        let roadAddress = searchAddress.replace(/臺/g, '台').replace(/\s+/g, '');

        // 移除「市／縣」以前的內容
        roadAddress = roadAddress.replace(/^.*?[市縣]/, '');

        // 移除「區／鄉／鎮／市」以前的內容
        roadAddress = roadAddress.replace(/^.*?[區鄉鎮市]/, '');

        // 移除門牌號碼
        // 例如：
        // 重慶南路一段122號
        // → 重慶南路一段
        roadAddress = roadAddress.replace(/\d+(?:-\d+)?(?:之\d+)?號.*$/, '');

        roadAddress = roadAddress.trim();

        console.log(`需求編號 ${demand.serialNo} 完整地址找不到，改搜尋道路：`, roadAddress);

        // 確認確實有道路名稱
        if (!roadAddress) {
          return false;
        }

        // ==========================================
        // 使用道路名稱重新搜尋
        // ==========================================

        const roadParams = {
          // 原本城市碼／台灣設定維持不變
          q: `${roadAddress}, Taiwan`,
          format: 'jsonv2',
          limit: '1',
          countrycodes: 'tw',
        };

        results = await firstValueFrom(
          this.http.get<NominatimSearchResult[]>(url, {
            params: roadParams,
          })
        );

        // 道路也找不到
        if (!results || results.length === 0) {
          return false;
        }

        const result = results[0];

        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        // 確認經緯度是有效數字
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return false;
        }

        // 寫入需求資料
        demand.latitude = latitude;
        demand.longitude = longitude;

        console.log(`需求編號 ${demand.serialNo} 完整地址：`, searchAddress);

        console.log(`需求編號 ${demand.serialNo} 使用道路名稱：`, roadAddress);

        console.log(`需求編號 ${demand.serialNo} 緯度：`, demand.latitude);

        console.log(`需求編號 ${demand.serialNo} 經度：`, demand.longitude);

        console.log('Nominatim 找到的位置：', result.display_name);

        return true;
      }

      // ==========================================
      // 完整地址搜尋成功
      // ==========================================

      const result = results[0];

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      // 確認經緯度是有效數字
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      // 寫入需求資料
      demand.latitude = latitude;
      demand.longitude = longitude;

      // 開發測試用
      console.log(`需求編號 ${demand.serialNo} 地址：`, searchAddress);

      console.log(`需求編號 ${demand.serialNo} 緯度：`, demand.latitude);

      console.log(`需求編號 ${demand.serialNo} 經度：`, demand.longitude);

      console.log('Nominatim 找到的位置：', result.display_name);

      return true;
    } catch (error) {
      console.error(`需求編號 ${demand.serialNo} 地址轉換經緯度失敗：`, error);

      return false;
    }
  }

  // ==========================================
  // 從 Service 載入資料
  // ==========================================

  loadDataFromService(): void {
    const storedData = localStorage.getItem('editVolunteerDemands');

    if (!storedData) {
      alert('沒有找到要編輯的志工需求');

      this.router.navigate(['/agency/disaster']);

      return;
    }

    try {
      const selectedDemands: VolunteerDemand[] = JSON.parse(storedData);

      this.editDemands = JSON.parse(JSON.stringify(selectedDemands)).map((demand: VolunteerDemandItem) => ({
        ...demand,
        status: demand.status ?? '上架',
        latitude: demand.latitude,
        longitude: demand.longitude,
      }));

      console.log('批次編輯資料：', this.editDemands);
    } catch (error) {
      console.error('讀取批次編輯資料失敗：', error);

      alert('讀取編輯資料失敗');

      this.router.navigate(['/agency/disaster']);
    }
  }

  // ==========================================
  // 判斷是否為手動下架
  // ==========================================

  isManualOffShelf(demand: VolunteerDemandItem): boolean {
    return demand.status === '下架' && demand.offShelfReason === 'manual';
  }

  // ==========================================
  // 點擊公開狀態
  // ==========================================

  onStatusClick(event: MouseEvent, demand: VolunteerDemandItem): void {
    if (this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();

      this.pendingDemand = demand;
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect('上架', demand);
  }

  // ==========================================
  // 狀態選擇
  // ==========================================

  onStatusSelect(newStatus: VolunteerDemand['status'], demand: VolunteerDemandItem): void {
    // 手動下架後不能重新上架
    if (this.isManualOffShelf(demand)) {
      if (newStatus === '上架') {
        this.pendingDemand = demand;
        demand.status = '下架';
        this.showOnShelfWarning = true;
      } else {
        demand.status = '下架';
      }

      return;
    }

    // 下架 → 跳出確認視窗
    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }

      this.pendingDemand = demand;

      // 先維持原本狀態，等使用者確認
      this.showOffShelfWarning = true;

      return;
    }

    // 隱藏
    if (newStatus === '隱藏') {
      demand.status = '隱藏';

      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;

      return;
    }

    // 上架
    if (newStatus === '上架') {
      demand.status = '上架';

      return;
    }
  }

  // ==========================================
  // 取消手動下架
  // ==========================================

  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  // ==========================================
  // 改為隱藏
  // ==========================================

  hideInsteadOfOffShelf(): void {
    if (!this.pendingDemand) {
      return;
    }

    this.pendingDemand.status = '隱藏';

    this.pendingDemand.publishedAt = undefined;

    this.pendingDemand.expectedOffShelfAt = undefined;

    this.pendingDemand.offShelfReason = undefined;

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  // ==========================================
  // 確認手動下架
  // ==========================================

  confirmManualOffShelf(): void {
    if (!this.pendingDemand) {
      return;
    }

    const now = new Date();

    this.pendingDemand.status = '下架';

    this.pendingDemand.offShelfReason = 'manual';

    this.pendingDemand.expectedOffShelfAt = now.toISOString();

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  // ==========================================
  // 關閉無法重新上架視窗
  // ==========================================

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.pendingDemand) {
      this.pendingDemand.status = '下架';

      this.pendingDemand.offShelfReason = 'manual';
    }

    this.pendingDemand = null;
  }

  // ==========================================
  // 批次儲存
  // ==========================================

  async saveAll(): Promise<void> {
    // 找出有勾選的資料
    const selectedDemands = this.editDemands.filter((demand) => demand.selected);

    // 沒有勾選
    if (selectedDemands.length === 0) {
      alert('請先勾選要編輯的志工需求！');
      return;
    }

    let isValid = true;

    // ==========================================
    // 只驗證「勾選」的資料
    // ==========================================

    selectedDemands.forEach((demand) => {
      demand.typeError = !demand.type;

      demand.peopleError = demand.people === null || demand.people === undefined || demand.people <= 0;

      demand.locationError = !demand.location?.trim();

      demand.conditionError = !demand.condition;

      demand.workContentError = !demand.workContent?.trim();

      demand.reasonError = !demand.reason?.trim();

      demand.contactError = !demand.contact?.trim();

      demand.phoneError = !demand.phone?.trim();

      // 只要有一個錯誤
      if (
        demand.typeError ||
        demand.peopleError ||
        demand.locationError ||
        demand.conditionError ||
        demand.workContentError ||
        demand.reasonError ||
        demand.contactError ||
        demand.phoneError
      ) {
        isValid = false;
      }
    });

    // 驗證失敗
    if (!isValid) {
      alert('請檢查紅框標示的必填欄位是否填寫完整！');
      return;
    }

    const now = new Date();

    // ==========================================
    // 處理勾選資料
    //
    // 注意：
    // 這裡不能使用 forEach，
    // 因為地址轉經緯度需要 await。
    // ==========================================

    for (const demand of selectedDemands) {
      // 手動下架不能重新上架
      if (demand.status === '上架' && demand.offShelfReason === 'manual') {
        demand.status = '下架';

        alert('此需求為使用者主動下架，無法重新上架。');

        return;
      }

      // ========================================
      // 上架
      // ========================================

      if (demand.status === '上架') {
        if (!demand.publishedAt) {
          demand.publishedAt = now.toISOString();
        }

        demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(demand.publishedAt), demand.priority);

        demand.offShelfReason = undefined;
      }

      // ========================================
      // 隱藏
      // ========================================
      else if (demand.status === '隱藏') {
        demand.publishedAt = undefined;

        demand.expectedOffShelfAt = undefined;

        demand.offShelfReason = undefined;
      }

      // ========================================
      // 下架
      // ========================================
      else if (demand.status === '下架') {
        if (!demand.offShelfReason) {
          demand.offShelfReason = 'manual';
        }

        if (!demand.expectedOffShelfAt) {
          demand.expectedOffShelfAt = now.toISOString();
        }
      }

      // ========================================
      // 地址轉換經緯度
      // ========================================

      const addressSuccess = await this.getCoordinatesFromAddress(demand.location, demand);

      if (!addressSuccess) {
        alert(`需求編號 ${demand.serialNo} 的地址無法找到位置，請確認地址是否正確。`);

        return;
      }

      console.log(`需求編號 ${demand.serialNo} 經緯度：`, demand.latitude, demand.longitude);
    }

    // ==========================================
    // 只處理勾選的資料
    // 移除 UI 專用欄位
    // ==========================================

    const cleanDemands: VolunteerDemand[] = selectedDemands.map(
      ({
        selected,
        typeError,
        peopleError,
        locationError,
        conditionError,
        workContentError,
        reasonError,
        contactError,
        phoneError,
        ...rest
      }) => rest
    );

    // ==========================================
    // 只更新勾選的資料
    // ==========================================

    this.volunteerDemandService.updateBatchDemands(cleanDemands);

    // 重新載入資料
    this.loadDataFromService();

    // 回到志工列表
    this.router.navigate(['/agency/disaster']);
  }

  // ==========================================
  // 計算預計下架日期
  // ==========================================

  calculateExpectedOffShelfDate(publishedDate: Date, priority: VolunteerDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 7);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 3);
        break;
    }

    return offShelfDate.toISOString();
  }

  // ==========================================
  // 取消
  // ==========================================

  cancel(): void {
    this.router.navigate(['/agency/disaster']);
  }
}
