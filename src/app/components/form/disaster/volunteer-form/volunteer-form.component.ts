import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';
import { VolunteerOnShelfComponent } from '../../../modal/shelf/volunteer-on-shelf/volunteer-on-shelf.component';
import { VolunteerOffShelfComponent } from '../../../modal/shelf/volunteer-off-shelf/volunteer-off-shelf.component';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Nominatim 回傳資料格式
interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-volunteer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, VolunteerOffShelfComponent, VolunteerOnShelfComponent],
  templateUrl: './volunteer-form.component.html',
  styleUrls: ['./volunteer-form.component.scss'],
})
export class VolunteerFormComponent implements OnInit {
  // 是否為編輯模式
  isEditMode: boolean = false;

  // 是否正在儲存／發布
  // 防止使用者連續點擊發布按鈕
  isSaving: boolean = false;

  // 是否顯示取消編輯確認視窗
  showCancelModal = false;

  // 是否顯示儲存成功視窗
  showSuccessModal = false;
  successMessage = '';

  // 手動下架確認視窗
  showOffShelfWarning = false;

  // 手動下架後重新上架警告視窗
  showOnShelfWarning = false;

  // 編輯前原本的狀態
  private originalStatus: VolunteerDemand['status'] = '隱藏';

  // 編輯前原本的下架原因
  private originalOffShelfReason: VolunteerDemand['offShelfReason'] | undefined;

  // 暫存使用者想選擇的狀態
  private pendingStatus: VolunteerDemand['status'] | undefined;

  // 編輯中的需求 ID
  editId: number | null = null;

  // 有錯誤的欄位
  invalidFields: string[] = [];

  // 志工需求資料
  demand: VolunteerDemand = {
    serialNo: 0,
    type: '',
    people: null,
    location: '',
    latitude: undefined,
    longitude: undefined,
    condition: '',
    workContent: '',
    reason: '',
    priority: '普通',
    status: '上架',
    createdAt: undefined,
    publishedAt: undefined,
    expectedOffShelfAt: undefined,
    offShelfReason: undefined,
    contact: '',
    phone: '',
    note: '',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private volunteerDemandService: VolunteerDemandService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 從網址取得 id
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editId = Number(id);
      this.isEditMode = true;

      this.loadEditDemand(this.editId);
    }
  }

  // ==========================================
  // 地址轉換成經緯度
  // ==========================================

  async getCoordinatesFromAddress(location: string, demand: VolunteerDemand): Promise<boolean> {
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
      let results = await firstValueFrom(
        this.http.get<NominatimSearchResult[]>(url, {
          params,
        })
      );

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

        console.log('完整地址找不到，改搜尋道路：', roadAddress);

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

        // ==========================================
        // 寫入需求資料
        // ==========================================

        demand.latitude = latitude;
        demand.longitude = longitude;

        console.log('完整地址：', searchAddress);
        console.log('完整地址找不到，使用道路名稱：', roadAddress);
        console.log('轉換後緯度：', demand.latitude);
        console.log('轉換後經度：', demand.longitude);
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

      // ==========================================
      // 寫入需求資料
      // ==========================================

      demand.latitude = latitude;
      demand.longitude = longitude;

      console.log('地址：', searchAddress);
      console.log('轉換後緯度：', demand.latitude);
      console.log('轉換後經度：', demand.longitude);
      console.log('Nominatim 找到的位置：', result.display_name);

      return true;
    } catch (error) {
      console.error('地址轉換經緯度失敗：', error);
      return false;
    }
  }

  // ==========================================
  // 載入要編輯的資料
  // ==========================================

  loadEditDemand(id: number): void {
    const demands = this.volunteerDemandService.getDemands();

    const target = demands.find((demand) => demand.serialNo === id);

    if (!target) {
      alert('找不到這筆志工需求');
      this.router.navigate(['/agency/disaster'], { queryParams: { activeTab: 'volunteer' } });
      return;
    }

    // 記錄編輯前的原始狀態
    this.originalStatus = target.status ?? '隱藏';
    this.originalOffShelfReason = target.offShelfReason;

    // 深拷貝
    this.demand = {
      ...JSON.parse(JSON.stringify(target)),
      status: target.status ?? '上架',
      publishedAt: target.publishedAt,
      expectedOffShelfAt: target.expectedOffShelfAt,
      offShelfReason: target.offShelfReason,
      latitude: target.latitude,
      longitude: target.longitude,
    };

    console.log('目前編輯資料：', this.demand);
  }

  // ==========================================
  // 判斷目前需求是否為手動下架
  // ==========================================

  isManualOffShelf(): boolean {
    return this.isEditMode && this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';
  }

  // ==========================================
  // 點擊公開狀態
  // ==========================================

  onStatusClick(event: MouseEvent, newStatus: VolunteerDemand['status']): void {
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

  // ==========================================
  // 狀態選擇
  // ==========================================

  onStatusSelect(newStatus: VolunteerDemand['status']): void {
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

    // ==========================================
    // 上架時選擇下架
    // ==========================================

    if (newStatus === '下架') {
      if (this.demand.status === '下架') {
        return;
      }

      this.pendingStatus = '下架';
      this.demand.status = this.originalStatus;
      this.showOffShelfWarning = true;

      return;
    }

    // ==========================================
    // 選擇隱藏
    // ==========================================

    if (newStatus === '隱藏') {
      this.demand.status = '隱藏';
      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;
      this.pendingStatus = undefined;

      return;
    }

    // ==========================================
    // 選擇上架
    // ==========================================

    if (newStatus === '上架') {
      this.demand.status = '上架';
      this.pendingStatus = undefined;

      return;
    }
  }

  // ==========================================
  // 使用者取消手動下架
  // ==========================================

  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;
    this.demand.status = this.originalStatus;
  }

  // ==========================================
  // 使用者選擇改為隱藏
  // ==========================================

  hideInsteadOfOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    this.demand.status = '隱藏';
    this.demand.publishedAt = undefined;
    this.demand.expectedOffShelfAt = undefined;
    this.demand.offShelfReason = undefined;
  }

  // ==========================================
  // 使用者確認手動下架
  // ==========================================

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

  // ==========================================
  // 關閉無法重新上架視窗
  // ==========================================

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    // 手動下架永遠維持下架
    if (this.isManualOffShelf()) {
      this.demand.status = '下架';
      this.demand.offShelfReason = 'manual';
    }
  }

  // ==========================================
  // 人數限制
  // ==========================================

  limitPeopleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const people = Number(input.value);

    if (people > 500) {
      input.value = '500';
      this.demand.people = 500;
    }
  }

  setPeople(value: string | number | null): void {
    if (value === null || value === '') {
      this.demand.people = null;
      return;
    }

    let people = Number(value);

    if (Number.isNaN(people)) {
      this.demand.people = null;
    } else {
      // 限制 1~500 之間
      if (people > 500) people = 500;
      if (people < 1) people = 1;

      this.demand.people = people;
    }
  }

  // ==========================================
  // 判斷欄位是否需要紅框
  // ==========================================

  isInvalid(field: string): boolean {
    if (!this.invalidFields.includes(field)) {
      return false;
    }

    switch (field) {
      case 'type':
        return !this.demand.type;

      case 'people':
        return !this.demand.people || this.demand.people < 1 || this.demand.people > 500;

      case 'location':
        return !this.demand.location.trim();

      case 'condition':
        return !this.demand.condition.trim();

      case 'workContent':
        return !this.demand.workContent.trim();

      case 'reason':
        return !this.demand.reason.trim();

      case 'contact':
        return !this.demand.contact.trim();

      case 'phone':
        return !this.demand.phone.trim();

      default:
        return false;
    }
  }

  // ==========================================
  // 儲存 / 發布
  // ==========================================

  async onPublish(): Promise<void> {
    // ==========================================
    // 防止重複點擊
    // ==========================================

    if (this.isSaving) {
      console.log('目前正在儲存，忽略這次點擊。');
      return;
    }

    // 第一次點擊後立即鎖定
    this.isSaving = true;

    // 讓畫面立即更新
    this.cdr.detectChanges();

    try {
      // ==========================================
      // 清除之前錯誤
      // ==========================================

      this.invalidFields = [];

      // ==========================================
      // 必填欄位檢查
      // ==========================================

      if (!this.demand.type) {
        this.invalidFields.push('type');
      }

      if (!this.demand.people || this.demand.people < 1 || this.demand.people > 500) {
        this.invalidFields.push('people');
      }

      if (!this.demand.location.trim()) {
        this.invalidFields.push('location');
      }

      if (!this.demand.condition.trim()) {
        this.invalidFields.push('condition');
      }

      if (!this.demand.workContent.trim()) {
        this.invalidFields.push('workContent');
      }

      if (!this.demand.reason.trim()) {
        this.invalidFields.push('reason');
      }

      if (!this.demand.contact.trim()) {
        this.invalidFields.push('contact');
      }

      if (!this.demand.phone.trim()) {
        this.invalidFields.push('phone');
      }

      // ==========================================
      // 有欄位錯誤
      // ==========================================

      if (this.invalidFields.length > 0) {
        setTimeout(() => {
          const firstInvalid = document.querySelector('.invalid-field') as HTMLElement;

          if (firstInvalid) {
            firstInvalid.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });

            firstInvalid.focus();
          }
        }, 0);

        // 驗證失敗，解除鎖定
        this.isSaving = false;
        this.cdr.detectChanges();

        return;
      }

      // ==========================================
      // 地址轉換經緯度
      // ==========================================

      console.log('開始將服務地點轉換成經緯度：');
      console.log(this.demand.location);

      const addressSuccess = await this.getCoordinatesFromAddress(this.demand.location, this.demand);

      // ==========================================
      // 地址找不到
      // ==========================================

      if (!addressSuccess) {
        alert('無法找到此地址的位置，請確認地址是否正確。');

        // API 失敗，解除鎖定，讓使用者可以重新操作
        this.isSaving = false;
        this.cdr.detectChanges();

        return;
      }

      console.log('地址轉換成功：', this.demand.latitude, this.demand.longitude);

      // ==========================================
      // 編輯模式
      // ==========================================

      if (this.isEditMode) {
        const originalItem = this.volunteerDemandService.getDemands().find((item) => item.serialNo === this.demand.serialNo);

        const originalStatus = originalItem?.status;

        const originalOffShelfReason = originalItem?.offShelfReason;

        const originalPublishedAt = originalItem?.publishedAt;

        const now = new Date();

        // 判斷原本是否為手動下架
        const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

        const isCurrentManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

        // ==========================================
        // 手動下架禁止重新上架
        // ==========================================

        if (this.demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
          alert('此需求為使用者主動下架，無法重新上架。');

          this.demand.status = '下架';

          // 解除鎖定
          this.isSaving = false;
          this.cdr.detectChanges();

          return;
        }

        // ==========================================
        // 處理上架狀態
        // ==========================================

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

        // ==========================================
        // 處理隱藏狀態
        // ==========================================
        else if (this.demand.status === '隱藏') {
          this.demand.publishedAt = undefined;

          this.demand.expectedOffShelfAt = undefined;

          this.demand.offShelfReason = undefined;
        }

        // ==========================================
        // 處理下架狀態
        // ==========================================
        else if (this.demand.status === '下架') {
          // 原本手動下架或這次確認下架
          // 保留原本的下架原因
          if (!this.demand.offShelfReason) {
            this.demand.offShelfReason = 'manual';
          }

          if (!this.demand.expectedOffShelfAt) {
            this.demand.expectedOffShelfAt = now.toISOString();
          }
        }

        // ==========================================
        // 更新資料
        // ==========================================

        this.volunteerDemandService.updateDemand(this.demand);

        console.log('修改後的志工需求：', this.demand);

        // ==========================================
        // 顯示成功視窗
        // ==========================================

        this.successMessage = '志工需求修改成功！';

        this.showSuccessModal = true;

        // 成功後保持 isSaving = true
        // 防止成功視窗關閉前再次儲存
        this.cdr.detectChanges();

        return;
      }

      // ==========================================
      // 新增模式
      // ==========================================

      const createdDate = new Date();

      const newDemand: VolunteerDemand = {
        ...this.demand,

        serialNo: this.getNextDemandId(),

        createdAt: createdDate.toISOString(),

        status: this.demand.status,

        messageCount: 0,

        // 確保經緯度一起存入資料
        latitude: this.demand.latitude,

        longitude: this.demand.longitude,
      };

      // ==========================================
      // 新增時選擇上架
      // ==========================================

      if (newDemand.status === '上架') {
        // 上架日期等於發布日期
        newDemand.publishedAt = createdDate.toISOString();

        // 計算預計下架日期
        newDemand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, newDemand.priority);

        // 新增上架不應該有下架原因
        newDemand.offShelfReason = undefined;
      } else {
        // 隱藏時尚未上架
        newDemand.publishedAt = undefined;

        newDemand.expectedOffShelfAt = undefined;

        newDemand.offShelfReason = undefined;
      }

      // ==========================================
      // 寫入資料
      // ==========================================

      this.volunteerDemandService.addDemand(newDemand);

      console.log('新增志工需求：', newDemand);

      // ==========================================
      // 顯示成功視窗
      // ==========================================

      this.successMessage = '志工需求發布成功！';

      this.showSuccessModal = true;

      // 成功後保持 isSaving = true
      // 防止再次點擊發布
      this.cdr.detectChanges();
    } catch (error) {
      console.error('發布／儲存志工需求失敗：', error);

      alert('儲存失敗，請稍後再試。');

      // 發生錯誤時才解除鎖定
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // 取得下一個需求編號
  // ==========================================

  private getNextDemandId(): number {
    const demands = this.volunteerDemandService.getDemands();

    const maxId = demands.reduce((currentMax, demand) => Math.max(currentMax, demand.serialNo), 0);

    return maxId + 1;
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

  onCancel(): void {
    if (this.isEditMode) {
      this.showCancelModal = true;
      return;
    }

    this.router.navigate(['/agency/disaster'], { queryParams: { activeTab: 'volunteer' } });
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  confirmCancel(): void {
    this.showCancelModal = false;

    this.router.navigate(['/agency/disaster'], { queryParams: { activeTab: 'volunteer' } });
  }

  // ==========================================
  // 關閉成功視窗
  // ==========================================

  closeSuccessModal(): void {
    this.showSuccessModal = false;

    this.router.navigate(['/agency/disaster'], { queryParams: { activeTab: 'volunteer' } });
  }
}
