import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { EditableDisasterDemand } from '../../../../models/agency/disaster-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { SupplyBatchEditLogic, SupplyBatchEditState } from '../../../logic/disaster/supply-batch-edit-logic';

@Component({
  selector: 'app-supply-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  templateUrl: './supply-batch-edit.component.html',
  styleUrls: ['./supply-batch-edit-A.component.scss', './supply-batch-edit-B.component.scss', './supply-batch-edit-C.component.scss'],
})
export class SupplyBatchEditComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  private logic: SupplyBatchEditLogic;

  editDemands: EditableDisasterDemand[] = [];

  showOffShelfWarning = false;
  showOnShelfWarning = false;

  pendingStatusDemand: EditableDisasterDemand | null = null;

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
  ) {
    this.logic = new SupplyBatchEditLogic(this.service, this.router, this.http);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.custom-select')) {
      this.editDemands.forEach((demand) => {
        demand.categoryDropdownOpen = false;
      });
    }
  }

  ngOnInit(): void {
    this.editDemands = this.logic.loadEditDemands();

    this.editDemands.forEach((demand) => {
      demand.imageFiles = [...(demand.image ?? [])];
    });

    this.editDemands = this.editDemands.map((demand) => this.logic.checkNaturalOffShelf(demand));

    this.cdr.detectChanges();

    console.log('批次修改資料:', this.editDemands);
  }

  getCoordinatesFromAddress(address: string, demand: EditableDisasterDemand): Promise<boolean> {
    return this.logic.getCoordinatesFromAddress(address, demand);
  }

  setContactTimeDifferent(demand: EditableDisasterDemand, different: boolean): void {
    this.logic.setContactTimeDifferent(demand, different);
  }

  toggleCategoryDropdown(demand: EditableDisasterDemand): void {
    this.logic.toggleCategoryDropdown(demand);
  }

  selectCategory(demand: EditableDisasterDemand, category: NonNullable<EditableDisasterDemand['category']>): void {
    this.logic.selectCategory(demand, category);
  }

  isManualOffShelf(demand: EditableDisasterDemand): boolean {
    return this.logic.isManualOffShelf(demand);
  }

  onStatusClick(event: MouseEvent, demand: EditableDisasterDemand, newStatus: EditableDisasterDemand['status']): void {
    const state = this.getState();

    this.logic.onStatusClick(event, demand, newStatus, state);

    this.applyState(state);
  }

  onStatusSelect(demand: EditableDisasterDemand, newStatus: EditableDisasterDemand['status']): void {
    const state = this.getState();

    this.logic.onStatusSelect(demand, newStatus, state);

    this.applyState(state);
  }

  cancelManualOffShelf(): void {
    const state = this.getState();

    this.logic.cancelManualOffShelf(state);

    this.applyState(state);
  }

  hideInsteadOfOffShelf(): void {
    const state = this.getState();

    this.logic.hideInsteadOfOffShelf(state);

    this.applyState(state);
  }

  confirmManualOffShelf(): void {
    const state = this.getState();

    this.logic.confirmManualOffShelf(state);

    this.applyState(state);
  }

  closeOnShelfWarning(): void {
    const state = this.getState();

    this.logic.closeOnShelfWarning(state);

    this.applyState(state);
  }

  onRemainingChange(demand: EditableDisasterDemand): void {
    this.logic.onRemainingChange(demand);
  }

  limitNumberLength(event: Event, demand: EditableDisasterDemand, field: 'amount' | 'remaining'): void {
    this.logic.limitNumberLength(event, demand, field);
  }

  preventMaxLength(event: KeyboardEvent, maxLength: number): void {
    this.logic.preventMaxLength(event, maxLength);
  }

  onImageSelected(event: Event, demand: EditableDisasterDemand): void {
    this.logic.onImageSelected(event, demand);
  }

  getImageUrl(image: File | string, demand: EditableDisasterDemand, index: number): string {
    return this.logic.getImageUrl(image, demand, index);
  }

  getImageName(image: File | string, demand: EditableDisasterDemand, index: number): string {
    return this.logic.getImageName(image, demand, index);
  }

  removeImage(demand: EditableDisasterDemand, index: number): void {
    this.logic.removeImage(demand, index);
  }

  async saveAll(): Promise<void> {
    const result = await this.logic.saveAll(this.editDemands);

    if (result.scrollToFirstError) {
      this.scrollToFirstError();
    }
  }

  scrollToFirstError(): void {
    this.logic.scrollToFirstError();
  }

  toggleCondition(demand: EditableDisasterDemand, key: keyof EditableDisasterDemand['conditions']): void {
    this.logic.toggleCondition(demand, key);
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    return this.logic.getConditionIcon(status);
  }

  addCustomCondition(demand: EditableDisasterDemand): void {
    this.logic.addCustomCondition(demand);
  }

  removeCustomCondition(demand: EditableDisasterDemand, index: number): void {
    this.logic.removeCustomCondition(demand, index);
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: EditableDisasterDemand['priority']): string {
    return this.logic.calculateExpectedOffShelfDate(publishedDate, priority);
  }

  trackByIndex(index: number): number {
    return index;
  }

  openImagePreview(image: string, imageName: string): void {
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.previewImage = '';
    this.previewImageName = '';
    this.showImagePreview = false;
  }

  cancel(): void {
    this.logic.cancel();
  }

  private getState(): SupplyBatchEditState {
    return {
      showOffShelfWarning: this.showOffShelfWarning,
      showOnShelfWarning: this.showOnShelfWarning,
      pendingStatusDemand: this.pendingStatusDemand,
    };
  }

  private applyState(state: SupplyBatchEditState): void {
    this.showOffShelfWarning = state.showOffShelfWarning;
    this.showOnShelfWarning = state.showOnShelfWarning;
    this.pendingStatusDemand = state.pendingStatusDemand;
  }
}
