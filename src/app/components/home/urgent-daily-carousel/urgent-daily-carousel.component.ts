import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DonorDailyCardComponent } from '../../card/daily/donor-daily-card/donor-daily-card.component';
import { priorityLabel, sortByPriorityThenDate } from '../../../core/codes/demand-codes';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

@Component({
  selector: 'app-urgent-daily-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, DonorDailyCardComponent],
  templateUrl: './urgent-daily-carousel.component.html',
  styleUrl: './urgent-daily-carousel.component.scss',
})
export class UrgentDailyCarouselComponent implements OnInit {
  private readonly demandService = inject(DailyDemandService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  items: DailyDemand[] = [];
  visibleCount = 3;
  startIndex = 0;
  isLoading = true;

  @HostListener('window:resize')
  onResize(): void {
    const next = this.computeVisibleCount();
    if (next !== this.visibleCount) {
      this.visibleCount = next;
      this.startIndex = 0;
      this.cdr.detectChanges();
    }
  }

  async ngOnInit(): Promise<void> {
    this.visibleCount = this.computeVisibleCount();
    try {
      await this.demandService.waitUntilLoaded();
      const listed = this.demandService
        .getDemands()
        .filter((item) => item.status?.trim() === '上架')
        .map((item) => ({ ...item, priority: priorityLabel(item.priority) }));
      this.items = sortByPriorityThenDate(listed.filter((item) => item.priority === '非常緊急')).slice(0, 12);
    } catch (error) {
      console.error('載入首頁非常緊急物資失敗：', error);
      this.items = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get pageItems(): DailyDemand[] {
    if (this.items.length <= this.visibleCount) {
      return this.items;
    }
    const result: DailyDemand[] = [];
    for (let i = 0; i < this.visibleCount; i += 1) {
      result.push(this.items[(this.startIndex + i) % this.items.length]);
    }
    return result;
  }

  get canPage(): boolean {
    return this.items.length > this.visibleCount;
  }

  get emptySlots(): number[] {
    const filled = this.pageItems.length;
    if (filled >= this.visibleCount) {
      return [];
    }
    return Array.from({ length: this.visibleCount - filled }, (_, index) => index);
  }

  prev(): void {
    if (!this.canPage) {
      return;
    }
    this.startIndex = (this.startIndex - 1 + this.items.length) % this.items.length;
  }

  next(): void {
    if (!this.canPage) {
      return;
    }
    this.startIndex = (this.startIndex + 1) % this.items.length;
  }

  openDetail(item: DailyDemand): void {
    void this.router.navigate(['/donor/daily/detail', item.id]);
  }

  private computeVisibleCount(): number {
    const width = typeof window === 'undefined' ? 1200 : window.innerWidth;
    if (width < 640) {
      return 1;
    }
    if (width < 900) {
      return 2;
    }
    if (width < 1200) {
      return 3;
    }
    return 4;
  }
}
