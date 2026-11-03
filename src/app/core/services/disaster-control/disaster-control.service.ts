import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from '../database/supabase.service';

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
const TABLE_NAME = 'disaster_control_state';

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
export class DisasterControlService implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly zone = inject(NgZone);
  readonly data = signal<DisasterControlData>(this.loadData());
  /** Increments for each closed -> open transition so the app shell can replay its broadcast. */
  readonly openBroadcast = signal(0);
  /** Increments for each open -> closed transition so donors can be ejected immediately. */
  readonly closeBroadcast = signal(0);
  readonly initialized: Promise<void>;
  private realtimeChannel?: RealtimeChannel;

  constructor() {
    window.addEventListener('storage', this.handleStorageChange);
    this.subscribeToRealtime();
    this.initialized = this.loadFromSupabase();
    this.armCloseTimer();
  }

  setOpen(isOpen: boolean): void {
    this.updateData({
      isOpen,
      closedAt: isOpen ? null : Date.now(),
      scheduledCloseAt: isOpen ? null : this.data().scheduledCloseAt,
    });
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
    this.applyData(nextData);
    void this.persistToSupabase(nextData);
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
      this.closeScheduledDisaster();
      return;
    }

    this.closeTimer = setTimeout(() => this.closeScheduledDisaster(), delay);
  }

  private closeScheduledDisaster(): void {
    const nextData = {
      ...this.data(),
      isOpen: false,
      closedAt: Date.now(),
      scheduledCloseAt: null,
      announcement: '',
    };
    this.applyData(nextData);
    void this.persistToSupabase(nextData);
    this.closeTimer = undefined;
  }

  private async loadFromSupabase(): Promise<void> {
    const { data, error } = await this.supabase.client.from(TABLE_NAME).select('*').eq('id', 1).maybeSingle();
    if (error) {
      console.warn('無法載入跨裝置災害模式，暫用本機快取：', error.message);
      return;
    }
    if (data) {
      this.applyDatabaseRow(data);
    }
  }

  private subscribeToRealtime(): void {
    this.realtimeChannel = this.supabase.client
      .channel('disaster-control-state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME, filter: 'id=eq.1' },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            this.applyDatabaseRow(payload.new);
          }
        },
      )
      .subscribe();
  }

  private async persistToSupabase(value: DisasterControlData): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE_NAME).upsert({
      id: 1,
      is_open: value.isOpen,
      closed_at: value.closedAt,
      scheduled_close_at: value.scheduledCloseAt,
      announcement: value.announcement,
      name: value.name,
      description: value.description,
      material_needs: value.materialNeeds,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('同步災害模式失敗：', error.message);
    }
  }

  private applyDatabaseRow(row: Record<string, unknown>): void {
    const cachedImage = this.data().image;
    this.applyData({
      isOpen: row['is_open'] === true,
      closedAt: typeof row['closed_at'] === 'number' ? row['closed_at'] : null,
      scheduledCloseAt: typeof row['scheduled_close_at'] === 'string' ? row['scheduled_close_at'] : null,
      announcement: typeof row['announcement'] === 'string' ? row['announcement'] : '',
      name: typeof row['name'] === 'string' ? row['name'] : '',
      description: typeof row['description'] === 'string' ? row['description'] : '',
      image: cachedImage,
      materialNeeds: Array.isArray(row['material_needs']) ? row['material_needs'] as MaterialNeed[] : [],
    });
  }

  private applyData(nextData: DisasterControlData): void {
    const apply = () => {
      const wasOpen = this.data().isOpen;
      const opened = !wasOpen && nextData.isOpen;
      const closed = wasOpen && !nextData.isOpen;
      this.data.set(nextData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      localStorage.setItem('disasterOpen', String(nextData.isOpen));
      if (opened) {
        this.openBroadcast.update((value) => value + 1);
      }
      if (closed) {
        this.closeBroadcast.update((value) => value + 1);
      }
      this.armCloseTimer();
    };

    if (NgZone.isInAngularZone()) {
      apply();
      return;
    }

    this.zone.run(apply);
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
      this.applyData({
        ...defaultData,
        ...JSON.parse(event.newValue) as Partial<DisasterControlData>,
      });
    } catch {
      this.applyData(defaultData);
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.handleStorageChange);
    if (this.closeTimer !== undefined) {
      clearTimeout(this.closeTimer);
    }
    if (this.realtimeChannel) {
      void this.supabase.client.removeChannel(this.realtimeChannel);
    }
  }
}
