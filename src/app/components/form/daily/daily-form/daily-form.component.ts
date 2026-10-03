import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyImagePreviewComponent } from '../../../modal/image-preview/supply-image-preview/supply-image-preview.component';
import { SupplyOffShelfComponent } from '../../../modal/shelf/supply-off-shelf/supply-off-shelf.component';
import { SupplyOnShelfComponent } from '../../../modal/shelf/supply-on-shelf/supply-on-shelf.component';
import { DailyFormLogic } from '../../../logic/daily/daily-form.logic';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-daily-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SupplyImagePreviewComponent, SupplyOffShelfComponent, SupplyOnShelfComponent],
  templateUrl: './daily-form.component.html',
  styleUrls: [
    './daily-form-A.component.scss',
    './daily-form-B.component.scss',
    './daily-form-C.component.scss',
    './daily-form-D.component.scss',
  ],
})
export class DailyFormComponent implements OnInit, AfterViewInit {
  private readonly logic: DailyFormLogic;

  @ViewChild('itemInput') itemInput!: ElementRef;
  @ViewChild('amountInput') amountInput!: ElementRef;
  @ViewChild('unitInput') unitInput!: ElementRef;
  @ViewChild('remainingInput') remainingInput!: ElementRef;
  @ViewChild('categoryInput') categoryInput!: ElementRef;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef;

  constructor(dailyDemandService: DailyDemandService, router: Router, route: ActivatedRoute, httpClient: HttpClient) {
    this.logic = new DailyFormLogic(dailyDemandService, router, route, httpClient);
  }

  get isEditMode(): boolean {
    return this.logic.isEditMode;
  }

  set isEditMode(value: boolean) {
    this.logic.isEditMode = value;
  }

  get submitted(): boolean {
    return this.logic.submitted;
  }

  get fromDetail(): boolean {
    return this.logic.fromDetail;
  }

  get hasServiceTarget(): boolean {
    return this.logic.hasServiceTarget;
  }

  get demand(): DailyDemand {
    return this.logic.demand;
  }

  set demand(value: DailyDemand) {
    this.logic.demand = value;
  }

  get serviceTargetOptions(): string[] {
    return this.logic.serviceTargetOptions;
  }

  get imageFiles(): File[] {
    return this.logic.imageFiles;
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

  get categoryDropdownOpen(): boolean {
    return this.logic.categoryDropdownOpen;
  }

  get categoryOptions(): NonNullable<DailyDemand['category']>[] {
    return this.logic.categoryOptions;
  }

  get showOffShelfWarning(): boolean {
    return this.logic.showOffShelfWarning;
  }

  get showOnShelfWarning(): boolean {
    return this.logic.showOnShelfWarning;
  }

  get isManualOffShelf(): boolean {
    return this.logic.isManualOffShelf;
  }

  get hasReceiveMethod(): boolean {
    return this.logic.hasReceiveMethod;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.logic.onDocumentClick(event);
  }

  async ngOnInit(): Promise<void> {
    await this.logic.ngOnInit();
  }

  ngAfterViewInit(): void {
    this.logic.ngAfterViewInit();
  }

  toggleCategoryDropdown(): void {
    this.logic.toggleCategoryDropdown();
  }

  selectCategory(category: NonNullable<DailyDemand['category']>): void {
    this.logic.selectCategory(category);
  }

  onStatusClick(event: MouseEvent, newStatus: DailyDemand['status']): void {
    this.logic.onStatusClick(event, newStatus);
  }

  onStatusSelect(newStatus: DailyDemand['status']): void {
    this.logic.onStatusSelect(newStatus);
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

  isServiceTargetSelected(target: string): boolean {
    return this.logic.isServiceTargetSelected(target);
  }

  toggleServiceTarget(target: string): void {
    this.logic.toggleServiceTarget(target);
  }

  addCustomCondition(): void {
    this.logic.addCustomCondition();
  }

  removeCustomCondition(index: number): void {
    this.logic.removeCustomCondition(index);
  }

  addCustomServiceTarget(): void {
    this.logic.addCustomServiceTarget();
  }

  removeCustomServiceTarget(index: number): void {
    this.logic.removeCustomServiceTarget(index);
  }

  toggleCondition(key: keyof DailyDemand['conditions']): void {
    this.logic.toggleCondition(key);
  }

  getConditionIcon(status: '接受' | '不接受' | ''): string {
    return this.logic.getConditionIcon(status);
  }

  onRemainingChange(): void {
    this.logic.onRemainingChange();
  }

  limitNumberLength(event: Event, field: 'amount' | 'remaining'): void {
    this.logic.limitNumberLength(event, field);
  }

  limitTextLength(field: 'item' | 'amountDescription' | 'reason' | 'description' | 'brand' | 'note', maxLength: number): void {
    this.logic.limitTextLength(field, maxLength);
  }

  limitSimpleTextLength(field: 'unit' | 'recipient' | 'address' | 'phone', maxLength: number): void {
    this.logic.limitSimpleTextLength(field, maxLength);
  }

  limitCustomArrayTextLength(field: 'customServiceTargets' | 'customConditions', index: number, maxLength: number): void {
    this.logic.limitCustomArrayTextLength(field, index, maxLength);
  }

  onImageSelected(event: Event): void {
    this.logic.onImageSelected(event);
  }

  removeImage(index: number): void {
    this.logic.removeImage(index);
  }

  openImagePreview(image: string, imageName: string): void {
    this.logic.openImagePreview(image, imageName);
  }

  closeImagePreview(): void {
    this.logic.closeImagePreview();
  }

  trackByIndex(index: number): number {
    return index;
  }

  async save(): Promise<void> {
    const result = await this.logic.save();

    if (result.scrollTarget) {
      const elements: Record<string, ElementRef | undefined> = {
        item: this.itemInput,
        amount: this.amountInput,
        unit: this.unitInput,
        remaining: this.remainingInput,
        category: this.categoryInput,
        reason: this.reasonInput,
        description: this.descriptionInput,
      };

      const element = elements[result.scrollTarget];

      if (element) {
        element.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (result.scrollTarget === 'receive-method') {
        document.querySelector('.receive-method-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (result.scrollTarget === 'receive-info') {
        document.querySelector('.receive-info-box')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (result.scrollTarget === 'service-target') {
        document.querySelector('.service-target-area')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }
}
