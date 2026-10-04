import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { DisasterDemand, ConditionStatus } from '../../../../models/agency/disaster-demand';
import { SupplyFormLogic, SupplyFormStatusState } from '../../../logic/disaster/supply-form-logic';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  templateUrl: './supply-form.component.html',
  styleUrls: [
    './supply-form-A.component.scss',
    './supply-form-B.component.scss',
    './supply-form-C.component.scss',
    './supply-form-D.component.scss',
  ],
})
export class SupplyFormComponent implements OnInit, AfterViewInit {
  private readonly logic: SupplyFormLogic;

  isEditMode = false;
  submitted = false;
  imageFiles: (File | string)[] = [];

  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  categoryDropdownOpen = false;

  categoryOptions: NonNullable<DisasterDemand['category']>[] = [
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

  fromDetail = false;
  listNumber?: number;

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  private originalStatus: DisasterDemand['status'] = '隱藏';
  private originalOffShelfReason: DisasterDemand['offShelfReason'] | undefined;
  private pendingStatus: DisasterDemand['status'] | undefined;

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  demand: DisasterDemand = {
    serialNo: 0,
    item: '',
    amount: null,
    unit: '',
    amountDescription: '',
    reason: '',
    description: '',

    conditions: {
      全新: '',
      二手: '',
      有擦痕: '',
      過期: '',
      毀損: '',
    },

    customConditions: [''],
    conditionDescription: '',

    priority: '普通',
    status: '隱藏',
    address: '',
    latitude: undefined,
    longitude: undefined,
    phone: '',
    note: '',
    brand: '',
    image: [],
    imageFileNames: [],
    category: '',
    contactTimeDifferent: false,

    contactTimeMorning: false,
    contactTimeAfternoon: false,
    contactTimeEvening: false,

    weekdayMorning: false,
    weekdayAfternoon: false,
    weekdayEvening: false,

    weekendMorning: false,
    weekendAfternoon: false,
    weekendEvening: false,
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.logic = new SupplyFormLogic(this.disasterDemandService, this.http);
  }

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    const id = Number(rawId);

    this.fromDetail = this.route.snapshot.queryParamMap.get('from') === 'detail';

    this.listNumber = Number(this.route.snapshot.queryParamMap.get('number'));

    if (rawId === null) {
      this.isEditMode = false;
      this.listNumber = undefined;

      console.log('[SupplyFormComponent] 新增模式');

      return;
    }

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[SupplyFormComponent] 編輯網址的資料庫 id 不正確：', rawId);

      this.router.navigate(['/agency/disaster']);

      return;
    }

    this.isEditMode = true;

    console.log('[SupplyFormComponent] 編輯模式，資料庫 id：', id);

    try {
      const data = await this.disasterDemandService.getDemandById(id);

      if (!data) {
        console.error('[SupplyFormComponent] 找不到要編輯的災害物資，id：', id);

        this.router.navigate(['/agency/disaster']);

        return;
      }

      this.listNumber = data.serialNo;

      this.originalStatus = data.status ?? '隱藏';
      this.originalOffShelfReason = data.offShelfReason;

      this.demand = this.logic.normalizeDemand(data);

      this.imageFiles = [...(data.image ?? [])];

      await this.checkNaturalOffShelf();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[SupplyFormComponent] 載入編輯資料失敗：', error);

      this.router.navigate(['/agency/disaster']);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.custom-select')) {
      this.categoryDropdownOpen = false;
    }
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(category: NonNullable<DisasterDemand['category']>): void {
    this.demand.category = category;
    this.categoryDropdownOpen = false;
  }

  setContactTimeDifferent(different: boolean): void {
    this.demand.contactTimeDifferent = different;
  }

  isManualOffShelf(): boolean {
    return this.logic.isManualOffShelf(this.isEditMode, this.originalStatus, this.originalOffShelfReason);
  }

  private getStatusState(): SupplyFormStatusState {
    return {
      isEditMode: this.isEditMode,
      originalStatus: this.originalStatus,
      originalOffShelfReason: this.originalOffShelfReason,
      pendingStatus: this.pendingStatus,
      showOffShelfWarning: this.showOffShelfWarning,
      showOnShelfWarning: this.showOnShelfWarning,
    };
  }

  private applyStatusState(state: SupplyFormStatusState): void {
    this.pendingStatus = state.pendingStatus;
    this.showOffShelfWarning = state.showOffShelfWarning;
    this.showOnShelfWarning = state.showOnShelfWarning;
  }

  private async checkNaturalOffShelf(): Promise<void> {
    const changed = await this.logic.checkNaturalOffShelf(this.demand);

    if (changed) {
      this.originalStatus = '下架';
      this.originalOffShelfReason = 'natural';
    }
  }

  onStatusClick(event: MouseEvent, newStatus: DisasterDemand['status']): void {
    if (newStatus === '上架' && this.isManualOffShelf()) {
      event.preventDefault();
      event.stopPropagation();

      this.demand.status = '下架';
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(newStatus);
  }

  onStatusSelect(newStatus: DisasterDemand['status']): void {
    const state = this.getStatusState();

    this.logic.onStatusSelect(this.demand, state, newStatus);

    this.applyStatusState(state);
  }

  cancelManualOffShelf(): void {
    const state = this.getStatusState();

    this.logic.cancelManualOffShelf(this.demand, state);

    this.applyStatusState(state);
  }

  hideInsteadOfOffShelf(): void {
    const state = this.getStatusState();

    this.logic.hideInsteadOfOffShelf(this.demand, state);

    this.applyStatusState(state);
  }

  confirmManualOffShelf(): void {
    const state = this.getStatusState();

    this.logic.confirmManualOffShelf(this.demand, state);

    this.applyStatusState(state);
  }

  closeOnShelfWarning(): void {
    const state = this.getStatusState();

    this.logic.closeOnShelfWarning(this.demand, state);

    this.applyStatusState(state);
  }

  async getCoordinatesFromAddress(address: string): Promise<boolean> {
    return this.logic.getCoordinatesFromAddress(this.demand, address);
  }

  async save(): Promise<void> {
    this.submitted = true;

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.unit ||
      !this.demand.category ||
      !this.demand.reason ||
      !this.demand.description ||
      !this.demand.address ||
      !this.demand.phone ||
      (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined))
    ) {
      if (!this.demand.item) {
        this.itemInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.amount) {
        this.amountInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.unit) {
        this.unitInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (this.isEditMode && (this.demand.remaining === null || this.demand.remaining === undefined)) {
        this.remainingInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.category) {
        this.categoryInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.reason) {
        this.reasonInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (!this.demand.description) {
        this.descriptionInput.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }

      return;
    }

    const result = await this.logic.saveDemand(this.demand, this.isEditMode);

    if (!result.addressSuccess) {
      alert('無法找到此地址的位置，請確認地址是否正確。');

      return;
    }

    if (result.manualOffShelfBlocked) {
      alert('此需求為使用者主動下架，無法重新上架。');

      return;
    }

    if (!result.success) {
      return;
    }

    if (this.fromDetail) {
      this.router.navigate(['/agency/supply-detail', this.demand.serialNo]);
    } else {
      this.router.navigate(['/agency/disaster']);
    }
  }

  addCustomCondition(): void {
    this.logic.addCustomCondition(this.demand);
  }

  removeCustomCondition(index: number): void {
    this.logic.removeCustomCondition(this.demand, index);
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
    return this.logic.calculateExpectedOffShelfDate(publishedDate, priority);
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleCondition(key: keyof DisasterDemand['conditions']): void {
    this.logic.toggleCondition(this.demand, key);
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    return this.logic.getConditionIcon(status);
  }

  onRemainingChange(): void {
    this.logic.onRemainingChange(this.demand);
  }

  limitNumberLength(event: Event, field: 'amount' | 'remaining'): void {
    this.logic.limitNumberLength(this.demand, event, field, this.isEditMode);
  }

  limitTextLength(
    event: Event,
    field: 'item' | 'unit' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'address' | 'phone' | 'note',
    maxLength: number
  ): void {
    this.logic.limitTextLength(this.demand, event, field, maxLength);
  }

  limitCustomConditionLength(event: Event, index: number): void {
    this.logic.limitCustomConditionLength(this.demand, event, index);
  }

  onImageSelected(event: Event): void {
    this.logic.onImageSelected(this.demand, this.imageFiles, event);
  }

  getImageUrl(image: File | string, index: number): string {
    return this.logic.getImageUrl(this.demand, image, index);
  }

  getImageName(image: File | string, index: number): string {
    return this.logic.getImageName(this.demand, image, index);
  }

  removeImage(index: number): void {
    this.logic.removeImage(this.demand, this.imageFiles, index);
  }

  openImagePreview(image: string, imageName: string): void {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }
}
