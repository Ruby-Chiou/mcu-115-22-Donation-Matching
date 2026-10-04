import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { EditableDisasterDemand } from '../../../models/agency/disaster-demand';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface SupplyBatchEditState {
  showOffShelfWarning: boolean;
  showOnShelfWarning: boolean;
  pendingStatusDemand: EditableDisasterDemand | null;
}

export interface SaveAllResult {
  scrollToFirstError: boolean;
}

export class SupplyBatchEditLogic {
  constructor(
    private readonly service: DisasterDemandService,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  loadEditDemands(): EditableDisasterDemand[] {
    const data = localStorage.getItem('editDemands');
    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data).map((item: any) => ({
        ...item,
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
        categoryDropdownOpen: false,
        imageFiles: [],
      }));
    } catch (error) {
      console.error('讀取批次編輯資料失敗：', error);
      return [];
    }
  }

  async getCoordinatesFromAddress(address: string, demand: EditableDisasterDemand): Promise<boolean> {
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

  setContactTimeDifferent(demand: EditableDisasterDemand, different: boolean): void {
    demand.contactTimeDifferent = different;
  }

  toggleCategoryDropdown(demand: EditableDisasterDemand): void {
    demand.categoryDropdownOpen = !demand.categoryDropdownOpen;
  }

  selectCategory(demand: EditableDisasterDemand, category: NonNullable<EditableDisasterDemand['category']>): void {
    demand.category = category;
    demand.categoryDropdownOpen = false;
  }

  checkNaturalOffShelf(demand: EditableDisasterDemand): EditableDisasterDemand {
    if (demand.status !== '上架' || !demand.expectedOffShelfAt) {
      return demand;
    }
    if (new Date() < new Date(demand.expectedOffShelfAt)) {
      return demand;
    }
    const updatedDemand = {
      ...demand,
      status: '下架' as EditableDisasterDemand['status'],
      offShelfReason: 'natural' as const,
    };
    void this.service.updateDemand(updatedDemand);
    return updatedDemand;
  }

  isManualOffShelf(demand: EditableDisasterDemand): boolean {
    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);
    const originalStatus = originalItem?.status ?? demand.status;
    const originalOffShelfReason = originalItem?.offShelfReason;
    return originalStatus === '下架' && originalOffShelfReason === 'manual';
  }

  onStatusClick(
    event: MouseEvent,
    demand: EditableDisasterDemand,
    newStatus: EditableDisasterDemand['status'],
    state: SupplyBatchEditState
  ): void {
    if (newStatus === '上架' && this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();
      demand.status = '下架';
      demand.offShelfReason = 'manual';
      state.pendingStatusDemand = demand;
      state.showOnShelfWarning = true;
      return;
    }
    this.onStatusSelect(demand, newStatus, state);
  }

  onStatusSelect(demand: EditableDisasterDemand, newStatus: EditableDisasterDemand['status'], state: SupplyBatchEditState): void {
    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);
    const originalStatus = originalItem?.status ?? demand.status;
    const originalOffShelfReason = originalItem?.offShelfReason;
    const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';
    const isCurrentManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

    if (newStatus === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
      demand.status = '下架';
      state.pendingStatusDemand = demand;
      state.showOnShelfWarning = true;
      return;
    }

    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }
      state.pendingStatusDemand = demand;
      demand.status = originalStatus;
      state.showOffShelfWarning = true;
      return;
    }
    if (newStatus === '隱藏') {
      demand.status = '隱藏';
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;
      state.pendingStatusDemand = null;
      return;
    }

    if (newStatus === '上架') {
      demand.status = '上架';
      state.pendingStatusDemand = null;
    }
  }

  cancelManualOffShelf(state: SupplyBatchEditState): void {
    const demand = state.pendingStatusDemand;
    state.showOffShelfWarning = false;
    state.pendingStatusDemand = null;
    if (!demand) {
      return;
    }

    const originalItem = this.service.getDemands().find((item) => item.serialNo === demand.serialNo);
    if (originalItem) {
      demand.status = originalItem.status;
    }
  }

  hideInsteadOfOffShelf(state: SupplyBatchEditState): void {
    const demand = state.pendingStatusDemand;
    state.showOffShelfWarning = false;
    state.pendingStatusDemand = null;

    if (!demand) {
      return;
    }

    demand.status = '隱藏';
    demand.publishedAt = undefined;
    demand.expectedOffShelfAt = undefined;
    demand.offShelfReason = undefined;
  }

  confirmManualOffShelf(state: SupplyBatchEditState): void {
    const demand = state.pendingStatusDemand;
    state.showOffShelfWarning = false;
    state.pendingStatusDemand = null;

    if (!demand) {
      return;
    }
    const now = new Date();
    demand.status = '下架';
    demand.offShelfReason = 'manual';
    demand.expectedOffShelfAt = now.toISOString();
  }

  closeOnShelfWarning(state: SupplyBatchEditState): void {
    const demand = state.pendingStatusDemand;
    state.showOnShelfWarning = false;
    state.pendingStatusDemand = null;
    if (!demand) {
      return;
    }
    demand.status = '下架';
    demand.offShelfReason = 'manual';
  }

  onRemainingChange(demand: EditableDisasterDemand): void {
    if (demand.amount !== undefined && demand.amount !== null) {
      const maxAmount = Number(demand.amount);
      const currentRemaining = Number(demand.remaining);
      if (!isNaN(maxAmount) && !isNaN(currentRemaining)) {
        if (currentRemaining > maxAmount) {
          demand.remaining = maxAmount;
        }
      }
    }
  }

  limitNumberLength(event: Event, demand: EditableDisasterDemand, field: 'amount' | 'remaining'): void {
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

  preventMaxLength(event: KeyboardEvent, maxLength: number): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }
    const selectionLength = input.selectionEnd! - input.selectionStart!;
    if (input.value.length >= maxLength && selectionLength === 0) {
      event.preventDefault();
    }
  }

  onImageSelected(event: Event, demand: EditableDisasterDemand): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    if (demand.imageFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    demand.imageFiles.push(file);
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

  getImageUrl(image: File | string, demand: EditableDisasterDemand, index: number): string {
    if (typeof image === 'string') {
      return image;
    }
    return demand.image?.[index] ?? '';
  }

  getImageName(image: File | string, demand: EditableDisasterDemand, index: number): string {
    if (typeof image === 'string') {
      return demand.imageFileNames?.[index] ?? `物資圖片${index + 1}`;
    }
    return image.name;
  }

  removeImage(demand: EditableDisasterDemand, index: number): void {
    demand.imageFiles.splice(index, 1);
    if (demand.image) {
      demand.image.splice(index, 1);
    }
    if (demand.imageFileNames) {
      demand.imageFileNames.splice(index, 1);
    }
  }

  async saveAll(editDemands: EditableDisasterDemand[]): Promise<SaveAllResult> {
    editDemands.forEach((item) => {
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
    const invalid = editDemands.some(
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
      return {
        scrollToFirstError: true,
      };
    }
    this.prepareConditions(editDemands);
    editDemands = editDemands.map((demand) => this.checkNaturalOffShelf(demand));

    for (const item of editDemands) {
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }
      const originalItem = this.service.getDemands().find((demand) => demand.serialNo === item.serialNo);
      const originalStatus = originalItem?.status;
      const originalOffShelfReason = originalItem?.offShelfReason;
      const originalPublishedAt = originalItem?.publishedAt;
      const now = new Date();

      if (item.status === '上架') {
        const blocked = originalStatus === '下架' && originalOffShelfReason === 'manual';
        if (blocked) {
          alert(`需求編號 ${item.serialNo} 為使用者主動下架，無法重新上架。`);
          item.status = '下架';
          item.offShelfReason = 'manual';
          if (originalItem?.expectedOffShelfAt) {
            item.expectedOffShelfAt = originalItem.expectedOffShelfAt;
          }
          if (originalPublishedAt) {
            item.publishedAt = originalPublishedAt;
          }

          continue;
        }
        if (originalStatus !== '上架') {
          item.publishedAt = now.toISOString();
          if (!item.createdAt) {
            item.createdAt = now.toISOString();
          }
        } else if (originalPublishedAt) {
          item.publishedAt = originalPublishedAt;
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
        if (originalPublishedAt) {
          item.publishedAt = originalPublishedAt;
        }
        if (!item.expectedOffShelfAt) {
          item.expectedOffShelfAt = now.toISOString();
        }
      }
      const addressSuccess = await this.getCoordinatesFromAddress(item.address, item);

      if (!addressSuccess) {
        alert(`需求編號 ${item.serialNo} 的地址無法找到位置，請確認地址是否正確。`);
        return {
          scrollToFirstError: false,
        };
      }
      console.log(`需求編號 ${item.serialNo} 經緯度：`, item.latitude, item.longitude);
      await this.service.updateDemand(item);
    }
    localStorage.removeItem('editDemands');
    await this.router.navigate(['/agency/disaster']);

    return {
      scrollToFirstError: false,
    };
  }

  private prepareConditions(editDemands: EditableDisasterDemand[]): void {
    editDemands.forEach((item) => {
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
      conditionLabels.forEach((key) => {
        const status = item.conditions[key];

        if (status === '接受') {
          conditionParts.push(`${key}✔`);
        } else if (status === '不接受') {
          conditionParts.push(`${key}✘`);
        }
      });

      item.customConditions.forEach((condition) => {
        const value = condition.trim();
        if (value) {
          conditionParts.push(value);
        }
      });
      item.conditionDescription = conditionParts.join('、');
    });
  }

  scrollToFirstError(): void {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.invalid, .invalid-box') as HTMLElement | null;
      if (!firstErrorElement) {
        return;
      }

      const top = firstErrorElement.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    }, 100);
  }

  toggleCondition(demand: EditableDisasterDemand, key: keyof EditableDisasterDemand['conditions']): void {
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

  addCustomCondition(demand: EditableDisasterDemand): void {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: EditableDisasterDemand, index: number): void {
    demand.customConditions.splice(index, 1);
    if (demand.customConditions.length === 0) {
      demand.customConditions.push('');
    }
  }

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

  trackByIndex(index: number): number {
    return index;
  }

  cancel(): void {
    localStorage.removeItem('editDemands');
    void this.router.navigate(['/agency/disaster']);
  }
}
