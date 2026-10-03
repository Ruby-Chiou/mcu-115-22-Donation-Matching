import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/disaster-demand';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface SupplyFormStatusState {
  isEditMode: boolean;
  originalStatus: DisasterDemand['status'];
  originalOffShelfReason: DisasterDemand['offShelfReason'] | undefined;
  pendingStatus: DisasterDemand['status'] | undefined;
  showOffShelfWarning: boolean;
  showOnShelfWarning: boolean;
}

export interface SaveDemandResult {
  success: boolean;
  addressSuccess: boolean;
  manualOffShelfBlocked: boolean;
}

export class SupplyFormLogic {
  constructor(
    private readonly disasterDemandService: DisasterDemandService,
    private readonly http: HttpClient
  ) {}

  normalizeDemand(data: DisasterDemand): DisasterDemand {
    return {
      ...data,
      status: data.status ?? '隱藏',
      remaining: data.remaining ?? null,
      image: [...(data.image ?? [])],
      imageFileNames: [...(data.imageFileNames ?? [])],
      conditions: {
        ...(data.conditions ?? {
          全新: '',
          二手: '',
          有擦痕: '',
          過期: '',
          毀損: '',
        }),
      },
      customConditions: data.customConditions?.length ? [...data.customConditions] : [''],
      contactTimeDifferent: data.contactTimeDifferent ?? false,
      contactTimeMorning: data.contactTimeMorning ?? false,
      contactTimeAfternoon: data.contactTimeAfternoon ?? false,
      contactTimeEvening: data.contactTimeEvening ?? false,
      weekdayMorning: data.weekdayMorning ?? false,
      weekdayAfternoon: data.weekdayAfternoon ?? false,
      weekdayEvening: data.weekdayEvening ?? false,
      weekendMorning: data.weekendMorning ?? false,
      weekendAfternoon: data.weekendAfternoon ?? false,
      weekendEvening: data.weekendEvening ?? false,
    };
  }

  async checkNaturalOffShelf(demand: DisasterDemand): Promise<boolean> {
    if (demand.status !== '上架' || !demand.expectedOffShelfAt) {
      return false;
    }

    const now = new Date();
    const expectedOffShelfAt = new Date(demand.expectedOffShelfAt);

    if (now < expectedOffShelfAt) {
      return false;
    }

    demand.status = '下架';
    demand.offShelfReason = 'natural';

    console.log('[SupplyFormLogic] 需求已達自然下架時間：', demand.serialNo);

    await this.disasterDemandService.updateDemand(demand);

    return true;
  }

  isManualOffShelf(
    isEditMode: boolean,
    originalStatus: DisasterDemand['status'],
    originalOffShelfReason: DisasterDemand['offShelfReason'] | undefined
  ): boolean {
    return isEditMode && originalStatus === '下架' && originalOffShelfReason === 'manual';
  }

  onStatusSelect(demand: DisasterDemand, state: SupplyFormStatusState, newStatus: DisasterDemand['status']): void {
    if (!state.isEditMode) {
      demand.status = newStatus;

      if (newStatus === '隱藏') {
        demand.publishedAt = undefined;
        demand.expectedOffShelfAt = undefined;
        demand.offShelfReason = undefined;
      }

      return;
    }

    const wasManualOffShelf = state.originalStatus === '下架' && state.originalOffShelfReason === 'manual';

    const currentlyManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        demand.status = '下架';
        state.showOnShelfWarning = true;
      } else {
        demand.status = '下架';
      }

      return;
    }

    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }

      state.pendingStatus = '下架';
      demand.status = state.originalStatus;
      state.showOffShelfWarning = true;

      return;
    }

    if (newStatus === '隱藏') {
      demand.status = '隱藏';
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;
      state.pendingStatus = undefined;

      return;
    }

    if (newStatus === '上架') {
      demand.status = '上架';
      state.pendingStatus = undefined;
    }
  }

  cancelManualOffShelf(demand: DisasterDemand, state: SupplyFormStatusState): void {
    state.showOffShelfWarning = false;
    state.pendingStatus = undefined;
    demand.status = state.originalStatus;
  }

  hideInsteadOfOffShelf(demand: DisasterDemand, state: SupplyFormStatusState): void {
    state.showOffShelfWarning = false;
    state.pendingStatus = undefined;

    demand.status = '隱藏';
    demand.publishedAt = undefined;
    demand.expectedOffShelfAt = undefined;
    demand.offShelfReason = undefined;
  }

  confirmManualOffShelf(demand: DisasterDemand, state: SupplyFormStatusState): void {
    state.showOffShelfWarning = false;
    state.pendingStatus = undefined;

    const now = new Date();

    demand.status = '下架';
    demand.offShelfReason = 'manual';
    demand.expectedOffShelfAt = now.toISOString();
  }

  closeOnShelfWarning(demand: DisasterDemand, state: SupplyFormStatusState): void {
    state.showOnShelfWarning = false;

    if (this.isManualOffShelf(state.isEditMode, state.originalStatus, state.originalOffShelfReason)) {
      demand.status = '下架';
      demand.offShelfReason = 'manual';
    }
  }

  async getCoordinatesFromAddress(demand: DisasterDemand, address: string): Promise<boolean> {
    const url = 'https://nominatim.openstreetmap.org/search';

    const originalAddress = address.trim();

    if (!originalAddress) {
      return false;
    }

    let roadAddress = originalAddress.replace(/臺/g, '台');

    roadAddress = roadAddress.replace(/\d+(?:-\d+)?號.*$/, '');
    roadAddress = roadAddress.trim();
    roadAddress = roadAddress.replace(/^.*?[市縣]/, '');
    roadAddress = roadAddress.replace(/^.*?[區鄉鎮市]/, '');
    roadAddress = roadAddress.trim();

    console.log('================================');
    console.log('搜尋道路');
    console.log('原始地址：', originalAddress);
    console.log('道路名稱：', roadAddress);

    if (!roadAddress) {
      console.warn('無法從地址取得道路名稱：', originalAddress);
      console.log('================================');

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
        this.http.get<NominatimSearchResult[]>(url, {
          params: roadParams,
        })
      );

      console.log('Nominatim 道路搜尋回傳結果：', roadResults);

      if (!roadResults || roadResults.length === 0) {
        console.warn('找不到道路：', roadAddress);
        console.log('================================');

        return false;
      }

      const roadResult = roadResults[0];

      const latitude = Number(roadResult.lat);
      const longitude = Number(roadResult.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.warn('道路回傳的經緯度無效：', roadResult);
        console.log('================================');

        return false;
      }

      demand.latitude = latitude;
      demand.longitude = longitude;

      console.log('道路定位成功');
      console.log('原始地址：', originalAddress);
      console.log('搜尋道路：', roadAddress);
      console.log('緯度：', latitude);
      console.log('經度：', longitude);
      console.log('找到的位置：', roadResult.display_name);
      console.log('================================');

      return true;
    } catch (error) {
      console.error('道路搜尋失敗：', error);
      console.log('================================');

      return false;
    }
  }

  async saveDemand(demand: DisasterDemand, isEditMode: boolean): Promise<SaveDemandResult> {
    const addressSuccess = await this.getCoordinatesFromAddress(demand, demand.address);

    if (!addressSuccess) {
      return {
        success: false,
        addressSuccess: false,
        manualOffShelfBlocked: false,
      };
    }

    demand.customConditions = demand.customConditions.filter((item) => item.trim() !== '');

    if (demand.customConditions.length === 0) {
      demand.customConditions.push('');
    }

    if (isEditMode) {
      const originalItem = this.disasterDemandService.getDemands().find((item) => item.id === demand.id);

      const originalStatus = originalItem?.status;
      const originalOffShelfReason = originalItem?.offShelfReason;
      const originalPublishedAt = originalItem?.publishedAt;

      const now = new Date();

      const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

      const isCurrentManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

      if (demand.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
        demand.status = '下架';

        return {
          success: false,
          addressSuccess: true,
          manualOffShelfBlocked: true,
        };
      }

      if (demand.status === '上架') {
        if (originalStatus !== '上架') {
          demand.publishedAt = now.toISOString();

          if (!demand.createdAt) {
            demand.createdAt = now.toISOString();
          }
        } else if (originalPublishedAt) {
          demand.publishedAt = originalPublishedAt;
        }

        if (demand.publishedAt) {
          demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(demand.publishedAt), demand.priority);
        }

        demand.offShelfReason = undefined;
      } else if (demand.status === '隱藏') {
        demand.publishedAt = undefined;
        demand.expectedOffShelfAt = undefined;
        demand.offShelfReason = undefined;
      } else if (demand.status === '下架') {
        if (demand.offShelfReason === 'natural') {
          return await this.updateDemand(demand);
        }

        demand.offShelfReason = 'manual';

        if (!demand.expectedOffShelfAt) {
          demand.expectedOffShelfAt = now.toISOString();
        }
      }

      return await this.updateDemand(demand);
    }

    const createdDate = new Date();

    demand.createdAt = createdDate.toISOString();

    if (demand.status === '上架') {
      demand.publishedAt = createdDate.toISOString();

      demand.expectedOffShelfAt = this.calculateExpectedOffShelfDate(createdDate, demand.priority);

      demand.offShelfReason = undefined;
    } else {
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;
    }

    await this.disasterDemandService.addDemand(demand);

    return {
      success: true,
      addressSuccess: true,
      manualOffShelfBlocked: false,
    };
  }

  private async updateDemand(demand: DisasterDemand): Promise<SaveDemandResult> {
    await this.disasterDemandService.updateDemand(demand);

    return {
      success: true,
      addressSuccess: true,
      manualOffShelfBlocked: false,
    };
  }

  addCustomCondition(demand: DisasterDemand): void {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: DisasterDemand, index: number): void {
    demand.customConditions.splice(index, 1);

    if (demand.customConditions.length === 0) {
      demand.customConditions.push('');
    }
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
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

  toggleCondition(demand: DisasterDemand, key: keyof DisasterDemand['conditions']): void {
    const current = demand.conditions[key];

    if (current === '') {
      demand.conditions[key] = '接受';
    } else if (current === '接受') {
      demand.conditions[key] = '不接受';
    } else {
      demand.conditions[key] = '';
    }
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  onRemainingChange(demand: DisasterDemand): void {
    if (demand.remaining !== null && demand.remaining !== undefined) {
      demand.remaining = Number(demand.remaining);

      if (demand.amount !== null && demand.remaining > demand.amount) {
        demand.remaining = demand.amount;
      }
    }
  }

  limitNumberLength(demand: DisasterDemand, event: Event, field: 'amount' | 'remaining', isEditMode: boolean): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      demand.amount = value;

      if (!isEditMode) {
        demand.remaining = value;
      }
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

  limitTextLength(
    demand: DisasterDemand,
    event: Event,
    field: 'item' | 'unit' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'address' | 'phone' | 'note',
    maxLength: number
  ): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;

    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
    }

    demand[field] = input.value;
  }

  limitCustomConditionLength(demand: DisasterDemand, event: Event, index: number): void {
    const input = event.target as HTMLInputElement;

    if (input.value.length > 100) {
      input.value = input.value.slice(0, 100);
    }

    demand.customConditions[index] = input.value;
  }

  onImageSelected(demand: DisasterDemand, imageFiles: (File | string)[], event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (imageFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';

      return;
    }

    imageFiles.push(file);

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

  getImageUrl(demand: DisasterDemand, image: File | string, index: number): string {
    if (typeof image === 'string') {
      return image;
    }

    return demand.image?.[index] ?? '';
  }

  getImageName(demand: DisasterDemand, image: File | string, index: number): string {
    if (typeof image === 'string') {
      return demand.imageFileNames?.[index] ?? `物資圖片${index + 1}`;
    }

    return image.name;
  }

  removeImage(demand: DisasterDemand, imageFiles: (File | string)[], index: number): void {
    imageFiles.splice(index, 1);

    if (demand.image) {
      demand.image.splice(index, 1);
    }

    if (demand.imageFileNames) {
      demand.imageFileNames.splice(index, 1);
    }
  }
}
