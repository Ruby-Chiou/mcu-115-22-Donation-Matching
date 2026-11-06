import { Injectable } from '@angular/core';
import { normalizeServiceTargets } from '../../../core/codes/service-targets';
import { geocodeTaiwan, taiwanRoadName } from '../../../core/map/geocoding';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { calculateExpectedOffShelfAt, DAILY_OFF_SHELF_DAYS } from '../../../core/demand/expected-off-shelf';
import { DailyFormLogicBase } from './daily-form-logic-base';

export interface DailyFormSaveResult {
  scrollTarget?:
    'item' | 'amount' | 'unit' | 'remaining' | 'category' | 'reason' | 'description' | 'receive-method' | 'receive-info' | 'service-target';
  notice?: string;
  scrollTop?: boolean;
  loadFailed?: boolean;
}

@Injectable()
export class DailyFormLogic extends DailyFormLogicBase {
  constructor(dailyDemandService: DailyDemandService, router: Router, route: ActivatedRoute) {
    super(dailyDemandService, router, route);
  }

  async ngOnInit(): Promise<DailyFormSaveResult> {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    if (rawId === null) {
      this.isEditMode = false;
      return {};
    }

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyFormLogic] 編輯網址的資料庫 id 不正確：', rawId);
      await this.router.navigate(['/agency/daily']);
      return { notice: '編輯網址不正確', loadFailed: true };
    }

    this.isEditMode = true;

    try {
      const data = await this.dailyDemandService.getDemandById(id);

      if (!data) {
        console.error('[DailyFormLogic] 找不到要編輯的日常需求，id：', id);
        await this.router.navigate(['/agency/daily']);
        return { notice: '找不到要編輯的日常需求', loadFailed: true };
      }

      this.originalStatus = data.status ?? '隱藏';
      this.originalOffShelfReason = data.offShelfReason;

      const normalizedTargets = normalizeServiceTargets(data.serviceTargets, data.customServiceTargets);

      this.demand = {
        ...data,
        status: data.status ?? '上架',
        remaining: data.remaining ?? null,
        serviceTargets: normalizedTargets.serviceTargets,
        customServiceTargets: normalizedTargets.customServiceTargets,
        conditions: data.conditions
          ? { ...data.conditions }
          : {
              全新: '',
              二手: '',
              有擦痕: '',
              過期: '',
              毀損: '',
            },
        customConditions: data.customConditions?.length ? [...data.customConditions] : [''],
        recipient: data.recipient ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        requireShelfLife: !!data.requireShelfLife,
        logisticsStoreChain: data.logisticsStoreChain || '',
        logisticsStoreName: data.logisticsStoreName ?? '',
        logisticsStoreAddress: data.logisticsStoreAddress ?? '',
        image: [...(data.image ?? [])],
        imageFileNames: [...(data.imageFileNames ?? [])],
      };

      this.hasServiceTarget =
        this.demand.serviceTargets.length > 0 || this.demand.customServiceTargets.some((target) => target.trim());

      this.imageFiles = [];

    } catch (error) {
      console.error('[DailyFormLogic] 載入日常編輯資料失敗：', error);
      await this.router.navigate(['/agency/daily']);
      return { notice: '載入日常需求失敗', loadFailed: true };
    }

    return {};
  }

  /** UI 捲動改由元件執行，這裡只告知需要 scrollTop。 */
  afterViewReady(): DailyFormSaveResult {
    return { scrollTop: true };
  }

  onStatusClick(event: MouseEvent, newStatus: DailyDemand['status']): void {
    if (newStatus === '上架' && this.isManualOffShelf) {
      event.preventDefault();
      event.stopPropagation();

      this.demand.status = '下架';
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(newStatus);
  }

  onStatusSelect(newStatus: DailyDemand['status']): void {
    if (!this.isEditMode) {
      this.demand.status = newStatus;

      if (newStatus === '隱藏') {
        this.demand.publishedAt = undefined;
        this.demand.expectedOffShelfAt = undefined;
        this.demand.offShelfReason = undefined;
      }

      return;
    }

    const wasManualOffShelf = this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';

    const currentlyManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        this.demand.status = '下架';
        this.showOnShelfWarning = true;
      } else {
        this.demand.status = '下架';
      }

      return;
    }

    if (newStatus === '下架') {
      if (this.demand.status === '下架') {
        return;
      }

      this.pendingStatus = '下架';
      this.demand.status = this.originalStatus;
      this.showOffShelfWarning = true;

      return;
    }

    if (newStatus === '隱藏') {
      this.demand.status = '隱藏';
      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;
      this.pendingStatus = undefined;

      return;
    }

    if (newStatus === '上架') {
      this.demand.status = '上架';
      this.pendingStatus = undefined;
    }
  }

  cancelManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;
    this.demand.status = this.originalStatus;
  }

  hideInsteadOfOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;
    this.demand.status = '隱藏';
    this.demand.publishedAt = undefined;
    this.demand.expectedOffShelfAt = undefined;
    this.demand.offShelfReason = undefined;
  }

  confirmManualOffShelf(): void {
    this.showOffShelfWarning = false;
    this.pendingStatus = undefined;

    const now = new Date();

    this.demand.status = '下架';
    this.demand.offShelfReason = 'manual';
    this.demand.expectedOffShelfAt = now.toISOString();
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.isManualOffShelf) {
      this.demand.status = '下架';
      this.demand.offShelfReason = 'manual';
    }
  }

  async getCoordinatesFromAddress(address: string): Promise<boolean> {
    const roadAddress = taiwanRoadName(address);
    if (!roadAddress) {
      return false;
    }

    const point = await geocodeTaiwan(roadAddress);
    if (!point) {
      return false;
    }

    this.demand.latitude = point.latitude;
    this.demand.longitude = point.longitude;
    return true;
  }

  async save(): Promise<DailyFormSaveResult> {
    this.submitted = true;

    this.hasServiceTarget = this.demand.serviceTargets.length > 0 || this.demand.customServiceTargets.some((target) => target.trim());

    const hasReceiveMethod = this.demand.receiveMethod.寄送 || this.demand.receiveMethod.面交;
    const shippingSelected = !!this.demand.receiveMethod.寄送;
    const storeIncomplete =
      shippingSelected &&
      (!this.demand.logisticsStoreChain ||
        !this.demand.logisticsStoreName?.trim() ||
        !this.demand.logisticsStoreAddress?.trim());

    const invalidReceiveInfo =
      !hasReceiveMethod || !this.demand.recipient || !this.demand.address || storeIncomplete;

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.unit ||
      !this.demand.category ||
      !this.demand.reason ||
      !this.demand.description ||
      invalidReceiveInfo ||
      (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined))
    ) {
      if (!this.demand.item) {
        return {
          scrollTarget: 'item',
        };
      }

      if (!this.demand.amount) {
        return {
          scrollTarget: 'amount',
        };
      }

      if (!this.demand.unit) {
        return {
          scrollTarget: 'unit',
        };
      }

      if (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined)) {
        return {
          scrollTarget: 'remaining',
        };
      }

      if (!this.demand.category) {
        return {
          scrollTarget: 'category',
        };
      }

      if (!this.demand.reason) {
        return {
          scrollTarget: 'reason',
        };
      }

      if (!this.demand.description) {
        return {
          scrollTarget: 'description',
        };
      }

      if (!hasReceiveMethod) {
        return {
          scrollTarget: 'receive-method',
        };
      }

      if (!this.demand.recipient || !this.demand.address || storeIncomplete) {
        return {
          scrollTarget: 'receive-info',
          notice: storeIncomplete
            ? '有勾選寄送時，宅配地址與超商門市（品牌／名稱／地址）都要填，兩者可同時提供。'
            : undefined,
        };
      }

      return {};
    }

    if (!this.hasServiceTarget) {
      return {
        scrollTarget: 'service-target',
      };
    }

    const addressSuccess = await this.getCoordinatesFromAddress(this.demand.address);

    if (!addressSuccess) {
      return { notice: '無法找到此地址的位置，請確認地址是否正確。' };
    }

    this.demand.customConditions = this.demand.customConditions.filter((item) => item.trim() !== '');

    this.demand.customServiceTargets = this.demand.customServiceTargets.filter((item) => item.trim() !== '');

    if (this.demand.customConditions.length === 0) {
      this.demand.customConditions.push('');
    }

    if (this.demand.customServiceTargets.length === 0) {
      this.demand.customServiceTargets.push('');
    }

    this.demand.serviceTargetDescription = this.buildServiceTargetDescription();

    this.demand.conditionDescription = this.buildConditionDescription();

    if (this.isEditMode) {
      return this.saveEdit();
    }

    return this.saveNew();
  }

  private async saveEdit(): Promise<DailyFormSaveResult> {
    const now = new Date();

    const isOriginalManualOffShelf = this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';

    const isCurrentManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

    if (this.demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
      this.demand.status = '下架';
      return { notice: '此需求為使用者主動下架，無法重新上架。' };
    }

    if (this.demand.status === '上架') {
      if (this.originalStatus !== '上架') {
        this.demand.publishedAt = now.toISOString();

        if (!this.demand.createdAt) {
          this.demand.createdAt = now.toISOString();
        }
      }

      if (this.demand.publishedAt) {
        this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(this.demand.publishedAt), this.demand.priority);
      }

      this.demand.offShelfReason = undefined;
    } else if (this.demand.status === '隱藏') {
      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;
    } else if (this.demand.status === '下架') {
      if (!this.demand.offShelfReason) {
        this.demand.offShelfReason = 'manual';
      }

      if (!this.demand.expectedOffShelfAt) {
        this.demand.expectedOffShelfAt = now.toISOString();
      }
    }

    try {
      await this.dailyDemandService.updateDemand(this.demand);

      if (this.fromDetail) {
        await this.router.navigate(['/agency/daily-detail', this.demand.serialNo]);
      } else {
        await this.router.navigate(['/agency/daily'], {
          queryParams: {
            refresh: Date.now(),
          },
        });
      }

      return {};
    } catch (error) {
      console.error('修改日常物資需求失敗：', error);
      return { notice: this.saveFailureNotice(error) };
    }
  }

  private async saveNew(): Promise<DailyFormSaveResult> {
    const createdDate = new Date();

    this.demand.createdAt = createdDate.toISOString();

    if (this.demand.status === '上架') {
      this.demand.publishedAt = createdDate.toISOString();

      this.demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, this.demand.priority);

      this.demand.offShelfReason = undefined;
    } else {
      this.demand.publishedAt = undefined;
      this.demand.expectedOffShelfAt = undefined;
      this.demand.offShelfReason = undefined;
    }

    try {
      await this.dailyDemandService.addDemand(this.demand);

      await this.router.navigate(['/agency/daily'], {
        queryParams: {
          refresh: Date.now(),
        },
      });

      return {};
    } catch (error) {
      console.error('新增日常物資需求失敗：', error);
      return { notice: this.saveFailureNotice(error, '新增') };
    }
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    return calculateExpectedOffShelfAt(publishedDate, priority, DAILY_OFF_SHELF_DAYS);
  }

  private saveFailureNotice(error: unknown, action: '新增' | '修改' = '修改'): string {
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
    if (/require_shelf_life|logistics_store_/i.test(message)) {
      return `${action}失敗：資料庫尚未套用保質期／超商門市欄位，請先執行 migration 20261106000001 後再儲存。`;
    }
    return `${action}失敗，請稍後再試。`;
  }
}
