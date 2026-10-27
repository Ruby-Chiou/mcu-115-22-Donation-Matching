import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { geocodeTaiwan } from '../../../../core/map/geocoding';
import { HelperDemandService } from '../../../../core/services/agency-helper-demand/helper-demand.service';
import { HelperDemand } from '../../../../models/agency/helper-demand';

@Component({
  selector: 'app-helper-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './helper-form.component.html',
  styleUrls: ['./helper-form.component.scss'],
})
export class HelperFormComponent implements OnInit {
  isEditMode = false;
  isSaving = false;
  private originalLocation = '';
  showCancelModal = false;
  showSuccessModal = false;
  successMessage = '';

  editId: number | null = null;

  invalidFields: string[] = [];

  demand: HelperDemand = {
    id: 0,
    serialNo: 0,

    type: '',
    people: null,

    location: '',
    condition: '',
    workContent: '',
    reason: '',

    priority: '普通',
    status: '上架',

    contact: '',
    phone: '',
    note: '',

    messageCount: 0,

    createdAt: '',
    publishedAt: '',
    expectedOffShelfAt: '',
  };

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly helperDemandService: HelperDemandService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    /*
     * 新增頁：/agency/helper-form
     * 沒有 id 是正常狀況，不要當錯誤。
     */
    if (rawId === null) {
      this.isEditMode = false;
      this.editId = null;

      console.log('[HelperFormComponent] 新增模式');

      return;
    }

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[HelperFormComponent] 編輯網址資料庫 id 不正確：', rawId);

      this.router.navigate(['/agency/disaster']);

      return;
    }

    this.isEditMode = true;
    this.editId = id;

    await this.loadEditDemand(id);
  }

  /*
   * 直接向 Supabase 以資料庫主鍵 id 查資料，
   * 因此編輯頁重整後仍可正常顯示。
   */
  async loadEditDemand(id: number): Promise<void> {
    try {
      const target = await this.helperDemandService.getDemandById(id);

      console.log('[HelperFormComponent] Service 回傳編輯資料：', target);

      if (!target) {
        alert('找不到這筆協力需求');

        this.router.navigate(['/agency/disaster']);

        return;
      }

      /*
       * 深拷貝資料，避免使用者還沒按儲存就直接改到
       * Service 內快取的同一份物件。
       */
      this.demand = structuredClone(target);

      this.editId = this.demand.id;
      this.originalLocation = this.demand.location.trim();

      this.cdr.detectChanges();

      console.log('[HelperFormComponent] 目前編輯資料：', this.demand);
    } catch (error) {
      console.error('[HelperFormComponent] 載入協力者編輯資料失敗：', error);

      alert('載入協力需求失敗');

      this.router.navigate(['/agency/disaster']);
    }
  }

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

    const people = Number(value);

    this.demand.people = Number.isNaN(people) ? null : Math.min(500, Math.max(1, people));
  }

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

  private async getCoordinatesFromAddress(address: string): Promise<boolean> {
    const originalAddress = address.trim().replace(/臺/g, '台');

    if (!originalAddress) {
      return false;
    }

    // 1. 去掉門牌號碼，優先搜尋道路或街道名稱
    const withoutNumber = originalAddress.replace(/\d+(?:-\d+)?號.*$/, '').trim();

    // 2. 去掉巷、弄後面的內容，進一步簡化地址
    const roadOnly = withoutNumber.replace(/(?:巷|弄).*/, '').trim();

    // 3. 如果地址有「段」，準備搜尋到段的地址
    const roadMatch = withoutNumber.match(/^(.+?段)/);

    // 優先搜尋簡化地址，找到後就直接使用座標
    const searchAddresses: string[] = [];

    if (withoutNumber) {
      searchAddresses.push(withoutNumber);
    }

    if (roadOnly && !searchAddresses.includes(roadOnly)) {
      searchAddresses.push(roadOnly);
    }

    if (roadMatch && !searchAddresses.includes(roadMatch[1])) {
      searchAddresses.push(roadMatch[1]);
    }

    // 最後才搜尋完整地址，避免常見的門牌查詢浪費等待時間
    if (!searchAddresses.includes(originalAddress)) {
      searchAddresses.push(originalAddress);
    }

    for (const searchAddress of searchAddresses) {
      const point = await geocodeTaiwan(searchAddress);
      if (!point) {
        continue;
      }

      this.demand.latitude = point.latitude;
      this.demand.longitude = point.longitude;
      return true;
    }

    return false;
  }

  async onPublish(): Promise<void> {
    // 正在儲存時，忽略重複點擊
    if (this.isSaving) {
      return;
    }

    this.invalidFields = [];

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

    if (this.invalidFields.length > 0) {
      setTimeout(() => {
        const firstInvalid = document.querySelector('.invalid-field') as HTMLElement | null;

        if (firstInvalid) {
          firstInvalid.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          firstInvalid.focus();
        }
      }, 0);

      return;
    }

    this.isSaving = true;

    try {
      // 只有新增需求、地址變更或缺少座標時，才重新查詢
      const locationChanged = this.demand.location.trim() !== this.originalLocation;

      const hasCoordinates = Number.isFinite(this.demand.latitude) && Number.isFinite(this.demand.longitude);

      if (!this.isEditMode || locationChanged || !hasCoordinates) {
        const coordinatesFound = await this.getCoordinatesFromAddress(this.demand.location);

        if (!coordinatesFound) {
          alert('無法取得服務地點的座標，請確認地點是否正確後再試一次。');
          return;
        }
      }

      if (this.isEditMode) {
        const savedDemand = await this.helperDemandService.updateDemand(this.demand);

        this.demand = savedDemand;

        console.log('修改後的協力需求：', savedDemand);

        this.successMessage = '協力需求修改成功！';
        this.showSuccessModal = true;

        // 強制更新畫面，顯示儲存成功視窗
        this.cdr.detectChanges();

        return;
      }

      const newDemand: HelperDemand = {
        ...this.demand,

        /*
         * 新增時 id 不交給前端設定，
         * Supabase 會自動產生真正的資料庫主鍵。
         */
        id: 0,
        /*
         * serialNo 只作為畫面需求編號。
         */
        serialNo: this.getNextDemandSerialNo(),

        createdAt: new Date().toISOString(),

        status: this.demand.status,

        messageCount: 0,
      };

      const savedDemand = await this.helperDemandService.addDemand(newDemand);

      console.log('新增協力需求：', savedDemand);

      this.successMessage = '協力需求發布成功！';

      this.showSuccessModal = true;
    } catch (error) {
      console.error('儲存協力需求失敗：', error);

      alert('儲存失敗，請稍後再試');
    } finally {
      this.isSaving = false;
    }
  }

  /*
   * 只計算畫面顯示用的流水號。
   */
  private getNextDemandSerialNo(): number {
    const demands = this.helperDemandService.getDemands();

    const maxSerialNo = demands.reduce((currentMax, demand) => Math.max(currentMax, Number(demand.serialNo ?? 0)), 0);

    return maxSerialNo + 1;
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.showCancelModal = true;

      return;
    }

    this.router.navigate(['/agency/disaster']);
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  confirmCancel(): void {
    this.showCancelModal = false;

    this.router.navigate(['/agency/disaster']);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;

    this.router.navigate(['/agency/disaster']);
  }
}
