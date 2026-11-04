import { Router } from '@angular/router';
import { geocodeTaiwan, taiwanRoadName } from '../../../core/map/geocoding';
import { calculateExpectedOffShelfAt, DAILY_OFF_SHELF_DAYS } from '../../../core/demand/expected-off-shelf';
import { validateDemandImageUpload } from '../../../core/demand/image-upload-rules';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { EditableDailyDemand } from '../../../models/agency/daily-demand';

export type DailyTextField =
  'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note' | 'unit' | 'recipient' | 'address' | 'phone';

export class DailyBatchEditLogicBase {
  editDemands: EditableDailyDemand[] = [];

  protected originalStatusMap: {
    [serialNo: number]: EditableDailyDemand['status'];
  } = {};

  protected originalOffShelfReasonMap: {
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
    '健康與照護用品',
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
    protected readonly service: DailyDemandService,
    protected readonly router: Router
  ) {}

  async getCoordinatesFromAddress(address: string, demand: EditableDailyDemand): Promise<boolean> {
    const roadAddress = taiwanRoadName(address);
    if (!roadAddress) {
      return false;
    }

    const point = await geocodeTaiwan(roadAddress);
    if (!point) {
      return false;
    }

    demand.latitude = point.latitude;
    demand.longitude = point.longitude;
    return true;
  }

  isManualOffShelf(demand: EditableDailyDemand): boolean {
    return demand.status === '下架' && demand.offShelfReason === 'manual';
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

  onImageSelected(event: Event, demand: EditableDailyDemand): string | null {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return null;
    }

    if (!this.imageFiles[demand.serialNo]) {
      this.imageFiles[demand.serialNo] = [];
    }

    const file = input.files[0];
    const uploadError = validateDemandImageUpload((this.imagePreviewUrls[demand.serialNo] || []).length, file);

    if (uploadError) {
      input.value = '';
      return uploadError;
    }

    this.imageFiles[demand.serialNo].push(file);

    if (!this.imagePreviewUrls[demand.serialNo]) {
      this.imagePreviewUrls[demand.serialNo] = [];
    }

    if (!demand.imageFileNames) {
      demand.imageFileNames = [];
    }

    this.imagePreviewUrls[demand.serialNo].push(URL.createObjectURL(file));

    demand.imageFileNames.push(file.name);

    input.value = '';
    return null;
  }

  removeImage(demand: EditableDailyDemand, index: number): void {
    const urls = this.imagePreviewUrls[demand.serialNo];

    if (urls?.[index]) {
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
    }

    if (this.imageFiles[demand.serialNo]) {
      this.imageFiles[demand.serialNo].splice(index, 1);
    }
  }

  onRemainingChange(demand: EditableDailyDemand): void {
    if (demand.amount !== undefined && demand.amount !== null) {
      const maxAmount = Number(demand.amount);
      const currentRemaining = Number(demand.remaining);

      if (!isNaN(maxAmount) && !isNaN(currentRemaining) && currentRemaining > maxAmount) {
        demand.remaining = maxAmount;
      }
    }
  }

  limitNumberLength(event: Event, demand: EditableDailyDemand, field: 'amount' | 'remaining'): void {
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

  limitTextLength(event: Event, demand: EditableDailyDemand, field: DailyTextField, maxLength: number): void {
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
    const previewUrls = this.imagePreviewUrls[demand.serialNo] || [];

    const previewUrl = previewUrls[index];

    if (!previewUrl) {
      return;
    }

    this.previewImage = previewUrl;

    this.previewImageName = demand.imageFileNames?.[index] ?? `未命名圖片${index + 1}`;

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
    return calculateExpectedOffShelfAt(publishedDate, priority, DAILY_OFF_SHELF_DAYS);
  }

  /** 元件應捲動至第一個錯誤欄位。 */
  firstErrorScrollSelector(): string {
    return '.invalid, .invalid-box';
  }

  addCustomServiceTarget(demand: EditableDailyDemand): void {
    if (demand.customServiceTargets.length < 5) {
      demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(demand: EditableDailyDemand, index: number): void {
    if (demand.customServiceTargets.length > 1) {
      demand.customServiceTargets.splice(index, 1);
    }
  }

  toggleCondition(demand: EditableDailyDemand, key: keyof EditableDailyDemand['conditions']): void {
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

  addCustomCondition(demand: EditableDailyDemand): void {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: EditableDailyDemand, index: number): void {
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
}
