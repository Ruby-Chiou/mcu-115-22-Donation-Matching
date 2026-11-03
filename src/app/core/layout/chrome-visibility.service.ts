import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChromeVisibilityService {
  readonly headerHidden = signal(false);

  setHeaderHidden(hidden: boolean): void {
    this.headerHidden.set(hidden);
  }
}
