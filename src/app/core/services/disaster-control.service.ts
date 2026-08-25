import { Injectable, signal } from '@angular/core';

export interface MaterialNeed {
  item: string;
  quantity: number;
  unit: string;
}

export interface DisasterControlData {
  isOpen: boolean;
  closedAt: number | null;
  scheduledCloseAt: string | null;
  announcement: string;
  name: string;
  description: string;
  image: string | null;
  materialNeeds: MaterialNeed[];
}

const STORAGE_KEY = 'disasterControlData';

const defaultData: DisasterControlData = {
  isOpen: false,
  closedAt: null,
  scheduledCloseAt: null,
  announcement: '',
  name: '',
  description: '',
  image: null,
  materialNeeds: [],
};

@Injectable({ providedIn: 'root' })
export class DisasterControlService {
  readonly data = signal<DisasterControlData>(this.loadData());

  constructor() {
    window.addEventListener('storage', this.handleStorageChange);
    this.armCloseTimer();
  }

  setOpen(isOpen: boolean): void {
    this.updateData({
      isOpen,
      closedAt: isOpen ? null : Date.now(),
      scheduledCloseAt: isOpen ? null : this.data().scheduledCloseAt,
    });
    localStorage.setItem('disasterOpen', String(isOpen));
    this.armCloseTimer();
  }

  updateInfo(name: string, description: string): void {
    this.updateData({ name, description });
  }

  scheduleClose(scheduledCloseAt: string | null, announcement: string): void {
    this.updateData({
      scheduledCloseAt,
      announcement,
    });
    this.armCloseTimer();
  }

  setImage(image: string | null): void {
    this.updateData({ image });
  }

  addMaterial(material: MaterialNeed): void {
    this.updateData({
      materialNeeds: [...this.data().materialNeeds, material],
    });
  }

  removeMaterial(index: number): void {
    this.updateData({
      materialNeeds: this.data().materialNeeds.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  private updateData(changes: Partial<DisasterControlData>): void {
    const nextData = { ...this.data(), ...changes };
    this.data.set(nextData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
  }

  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  private armCloseTimer(): void {
    if (this.closeTimer !== undefined) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }

    const { isOpen, scheduledCloseAt } = this.data();
    if (!isOpen || !scheduledCloseAt) {
      return;
    }

    const delay = new Date(scheduledCloseAt).getTime() - Date.now();
    if (delay <= 0) {
      this.setOpen(false);
      return;
    }

    this.closeTimer = setTimeout(() => this.setOpen(false), delay);
  }

  private loadData(): DisasterControlData {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return {
        ...defaultData,
        isOpen: localStorage.getItem('disasterOpen') === 'true',
      };
    }

    try {
      return { ...defaultData, ...JSON.parse(savedData) as Partial<DisasterControlData> };
    } catch {
      return defaultData;
    }
  }

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      this.data.set({
        ...defaultData,
        ...JSON.parse(event.newValue) as Partial<DisasterControlData>,
      });
      this.armCloseTimer();
    } catch {
      this.data.set(defaultData);
    }
  };
}
