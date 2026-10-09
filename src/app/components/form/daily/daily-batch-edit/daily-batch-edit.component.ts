import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditableDailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { DailyBatchEditLogic } from '../../../logic/daily/daily-batch-edit.logic';

@Component({
  selector: 'app-daily-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  providers: [DailyBatchEditLogic],
  templateUrl: './daily-batch-edit.component.html',
  styleUrls: [
    './daily-batch-edit-A.component.scss',
    './daily-batch-edit-B.component.scss',
    './daily-batch-edit-C.component.scss',
    './daily-batch-edit-D.component.scss',
  ],
})
export class DailyBatchEditComponent implements OnInit {
  private readonly logic: DailyBatchEditLogic;

  constructor(logic: DailyBatchEditLogic) {
    this.logic = logic;
  }

  get editDemands(): EditableDailyDemand[] {
    return this.logic.editDemands;
  }

  get imageFiles(): { [serialNo: number]: File[] } {
    return this.logic.imageFiles;
  }

  get imagePreviewUrls(): { [serialNo: number]: string[] } {
    return this.logic.imagePreviewUrls;
  }

  get showImagePreview(): boolean {
    return this.logic.showImagePreview;
  }

  get previewImage(): string {
    return this.logic.previewImage;
  }

  get previewImageName(): string {
    return this.logic.previewImageName;
  }

  get categoryDropdownIndex(): number | null {
    return this.logic.categoryDropdownIndex;
  }

  get categoryOptions(): NonNullable<EditableDailyDemand['category']>[] {
    return this.logic.categoryOptions;
  }

  get showOffShelfWarning(): boolean {
    return this.logic.showOffShelfWarning;
  }

  get showOnShelfWarning(): boolean {
    return this.logic.showOnShelfWarning;
  }

  ngOnInit(): void {
    this.logic.init();
  }

  async saveAll(): Promise<void> {
    await this.logic.saveAll();
  }

  cancel(): void {
    this.logic.cancel();
  }

  isManualOffShelf(demand: EditableDailyDemand): boolean {
    return this.logic.isManualOffShelf(demand);
  }

  onStatusClick(event: MouseEvent, demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    this.logic.onStatusClick(event, demand, newStatus);
  }

  onStatusSelect(demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    this.logic.onStatusSelect(demand, newStatus);
  }

  cancelManualOffShelf(): void {
    this.logic.cancelManualOffShelf();
  }

  hideInsteadOfOffShelf(): void {
    this.logic.hideInsteadOfOffShelf();
  }

  confirmManualOffShelf(): void {
    this.logic.confirmManualOffShelf();
  }

  closeOnShelfWarning(): void {
    this.logic.closeOnShelfWarning();
  }

  isServiceTargetSelected(demand: EditableDailyDemand, target: string): boolean {
    return this.logic.isServiceTargetSelected(demand, target);
  }

  toggleServiceTarget(demand: EditableDailyDemand, target: string): void {
    this.logic.toggleServiceTarget(demand, target);
  }

  addCustomServiceTarget(demand: EditableDailyDemand): void {
    this.logic.addCustomServiceTarget(demand);
  }

  removeCustomServiceTarget(demand: EditableDailyDemand, index: number): void {
    this.logic.removeCustomServiceTarget(demand, index);
  }

  toggleCondition(demand: EditableDailyDemand, key: keyof EditableDailyDemand['conditions']): void {
    this.logic.toggleCondition(demand, key);
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    return this.logic.getConditionIcon(status);
  }

  addCustomCondition(demand: EditableDailyDemand): void {
    this.logic.addCustomCondition(demand);
  }

  removeCustomCondition(demand: EditableDailyDemand, index: number): void {
    this.logic.removeCustomCondition(demand, index);
  }

  toggleCategoryDropdown(index: number): void {
    this.logic.toggleCategoryDropdown(index);
  }

  selectCategory(demand: EditableDailyDemand, category: NonNullable<EditableDailyDemand['category']>): void {
    this.logic.selectCategory(demand, category);
  }

  onImageSelected(event: Event, demand: EditableDailyDemand): void {
    this.logic.onImageSelected(event, demand);
  }

  removeImage(demand: EditableDailyDemand, index: number): void {
    this.logic.removeImage(demand, index);
  }

  openImagePreview(demand: EditableDailyDemand, index: number): void {
    this.logic.openImagePreview(demand, index);
  }

  closeImagePreview(): void {
    this.logic.closeImagePreview();
  }

  onRemainingChange(demand: EditableDailyDemand): void {
    this.logic.onRemainingChange(demand);
  }

  limitNumberLength(event: Event, demand: EditableDailyDemand, field: 'amount' | 'remaining'): void {
    this.logic.limitNumberLength(event, demand, field);
  }

  limitTextLength(
    event: Event,
    demand: EditableDailyDemand,
    field: 'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note' | 'unit' | 'recipient' | 'address' | 'phone',
    maxLength: number
  ): void {
    this.logic.limitTextLength(event, demand, field, maxLength);
  }

  limitArrayTextLength(event: Event, array: string[], index: number, maxLength: number): void {
    this.logic.limitArrayTextLength(event, array, index, maxLength);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
