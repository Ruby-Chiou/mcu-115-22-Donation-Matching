import { Injectable, signal } from '@angular/core';

export interface HelperLocationSelection {
  cities: string[];
}

@Injectable({ providedIn: 'root' })
export class HelperLocationFilterService {
  readonly selection = signal<HelperLocationSelection>({ cities: [] });

  setCities(cities: string[]): void {
    this.selection.set({ cities: [...cities] });
  }

  clear(): void {
    this.setCities([]);
  }
}
