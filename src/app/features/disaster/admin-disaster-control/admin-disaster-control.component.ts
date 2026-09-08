import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DisasterControlService,
  MaterialNeed,
} from '../../../core/services/disaster-control.service';

@Component({
  selector: 'app-admin-disaster-control',
  imports: [DatePipe, FormsModule],

  templateUrl: './admin-disaster-control.component.html',
  styleUrl: './admin-disaster-control.component.scss',
})
export class AdminDisasterControlComponent {
  private readonly disasterService = inject(DisasterControlService);
  protected readonly disasterData = this.disasterService.data;

  isEditing = false;
  isAddingMaterial = false;
  disasterName = '';
  disasterDescription = '';
  scheduledCloseAt = '';
  announcement = '';
  disasterImage: string | null = null;
  materialNeeds: MaterialNeed[] = [];
  newMaterial: MaterialNeed = {
    item: '',
    quantity: 0,
    unit: '',
  };

  constructor() {
    const data = this.disasterData();
    this.disasterName = data.name;
    this.disasterDescription = data.description;
    this.scheduledCloseAt = this.toDateTimeLocal(data.scheduledCloseAt);
    this.announcement = data.announcement;
    this.disasterImage = data.image;
    this.materialNeeds = data.materialNeeds;
  }

  get isDisasterOpen(): boolean {
    return this.disasterData().isOpen;
  }

  openDisaster(): void {
    this.disasterService.setOpen(true);
  }

  closeDisaster(): void {
    this.disasterService.setOpen(false);
  }

  startEditing(): void {
    this.isEditing = true;
  }

  saveDisaster(): void {
    this.disasterService.updateInfo(
      this.disasterName.trim(),
      this.disasterDescription.trim(),
    );
    this.isEditing = false;
  }

  saveSchedule(): void {
    this.disasterService.scheduleClose(
      this.scheduledCloseAt ? new Date(this.scheduledCloseAt).toISOString() : null,
      this.announcement.trim(),
    );
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.disasterImage = reader.result as string;
      this.disasterService.setImage(this.disasterImage);
    };
    reader.readAsDataURL(file);
  }

  startAddingMaterial(): void {
    this.isAddingMaterial = true;
  }

  saveMaterial(): void {
    const material = {
      item: this.newMaterial.item.trim(),
      quantity: this.newMaterial.quantity,
      unit: this.newMaterial.unit,
    };
    if (!material.item || material.quantity <= 0) {
      return;
    }

    this.disasterService.addMaterial(material);
    this.materialNeeds = this.disasterData().materialNeeds;
    this.newMaterial = { item: '', quantity: 0, unit: '' };
    this.isAddingMaterial = false;
  }

  deleteMaterial(index: number): void {
    this.disasterService.removeMaterial(index);
    this.materialNeeds = this.disasterData().materialNeeds;
  }
}
