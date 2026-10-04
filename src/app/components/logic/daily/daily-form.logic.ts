import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DailyDemand } from '../../../models/agency/daily-demand';
import { DailyFormLogicBase } from './daily-form-logic-base';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface DailyFormSaveResult {
  scrollTarget?:
    'item' | 'amount' | 'unit' | 'remaining' | 'category' | 'reason' | 'description' | 'receive-method' | 'receive-info' | 'service-target';
}

@Injectable()
export class DailyFormLogic extends DailyFormLogicBase {
  constructor(dailyDemandService: DailyDemandService, router: Router, route: ActivatedRoute, httpClient: HttpClient) {
    super(dailyDemandService, router, route, httpClient);
  }

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    console.log('[DailyFormLogic] 取得路由資料庫 id：', {
      rawId,
      id,
    });

    if (rawId === null) {
      this.isEditMode = false;
      console.log('[DailyFormLogic] 新增模式');
      return;
    }

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[DailyFormLogic] 編輯網址的資料庫 id 不正確：', rawId);

      await this.router.navigate(['/agency/daily']);
      return;
    }

    this.isEditMode = true;

    console.log('[DailyFormLogic] 編輯模式，資料庫 id：', id);

    try {
      const data = await this.dailyDemandService.getDemandById(id);

      console.log('[DailyFormLogic] Service 回傳編輯資料：', data);

      console.log('[DailyFormLogic] 編輯 conditions：', data?.conditions);

      if (!data) {
        console.error('[DailyFormLogic] 找不到要編輯的日常需求，id：', id);

        await this.router.navigate(['/agency/daily']);
        return;
      }

      this.originalStatus = data.status ?? '隱藏';
      this.originalOffShelfReason = data.offShelfReason;

      let serviceTargets: string[] = [];

      if (Array.isArray(data.serviceTargets)) {
        serviceTargets = [...data.serviceTargets];
      } else if (data.serviceTargets && typeof data.serviceTargets === 'object') {
        serviceTargets = Object.entries(data.serviceTargets)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }

      this.demand = {
        ...data,
        status: data.status ?? '上架',
        remaining: data.remaining ?? null,
        serviceTargets,
        customServiceTargets: data.customServiceTargets?.length ? [...data.customServiceTargets] : [''],
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
        image: [...(data.image ?? [])],
        imageFileNames: [...(data.imageFileNames ?? [])],
      };

      this.imageFiles = [];

      console.log('[DailyFormLogic] 編輯資料已載入：', this.demand);
    } catch (error) {
      console.error('[DailyFormLogic] 載入日常編輯資料失敗：', error);

      alert('載入日常需求失敗');

      await this.router.navigate(['/agency/daily']);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    }, 0);
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
    const url = 'https://nominatim.openstreetmap.org/search';

    const originalAddress = address.trim();

    if (!originalAddress) {
      return false;
    }

    let roadAddress = originalAddress.replace(/臺/g, '台');

    roadAddress = roadAddress.replace(/\d+(?:-\d+)?(?:之\d+)?號.*$/, '');

    roadAddress = roadAddress.trim();

    roadAddress = roadAddress.replace(/^.*?[市縣]/, '');

    roadAddress = roadAddress.replace(/^.*?[區鄉鎮市]/, '');

    roadAddress = roadAddress.trim();

    if (!roadAddress) {
      return false;
    }

    const roadParams = {
      q: `${roadAddress}, Taiwan`,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'tw',
    };

    try {
      const roadResults = await firstValueFrom(
        this.httpClient.get<NominatimSearchResult[]>(url, {
          params: roadParams,
        })
      );

      if (!roadResults || roadResults.length === 0) {
        return false;
      }

      const roadResult = roadResults[0];

      const latitude = Number(roadResult.lat);
      const longitude = Number(roadResult.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      this.demand.latitude = latitude;
      this.demand.longitude = longitude;

      return true;
    } catch {
      return false;
    }
  }

  async save(): Promise<DailyFormSaveResult> {
    this.submitted = true;

    this.hasServiceTarget = this.demand.serviceTargets.length > 0 || this.demand.customServiceTargets.some((target) => target.trim());

    const hasReceiveMethod = this.demand.receiveMethod.寄送 || this.demand.receiveMethod.面交;

    const invalidReceiveInfo = !hasReceiveMethod || !this.demand.recipient || !this.demand.address;

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

      if (!this.demand.recipient || !this.demand.address) {
        return {
          scrollTarget: 'receive-info',
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
      alert('無法找到此地址的位置，請確認地址是否正確。');

      return {};
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
      await this.saveEdit();
    } else {
      await this.saveNew();
    }

    return {};
  }

  private async saveEdit(): Promise<void> {
    const now = new Date();

    const isOriginalManualOffShelf = this.originalStatus === '下架' && this.originalOffShelfReason === 'manual';

    const isCurrentManualOffShelf = this.demand.status === '下架' && this.demand.offShelfReason === 'manual';

    if (this.demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
      alert('此需求為使用者主動下架，無法重新上架。');

      this.demand.status = '下架';

      return;
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
    } catch (error) {
      console.error('修改日常物資需求失敗：', error);

      alert('修改失敗，請稍後再試。');
    }
  }

  private async saveNew(): Promise<void> {
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
    } catch (error) {
      console.error('新增日常物資需求失敗：', error);

      alert('新增失敗，請稍後再試。');
    }
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
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
}
