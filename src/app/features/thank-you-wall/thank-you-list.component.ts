import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { BoardAnnouncement, BoardAnnouncementService } from '../../core/services/admin/board-announcement.service';
import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';
import { PublicDonationThank } from '../../models/member/public-donation-thank';
import { normalizeThankWallNotices } from './thank-wall-notices';

/** 感謝名單：滿寬版型（與首頁「為什麼做這個平台」同色底、左右拉寬留縫）。 */
@Component({
  selector: 'app-thank-you-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './thank-you-list.component.html',
  styleUrl: './thank-you-list.component.scss',
})
export class ThankYouListComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly thankService = inject(PublicDonationThankService);
  private readonly boards = inject(BoardAnnouncementService);
  private readonly zone = inject(NgZone);

  @ViewChild('wallViewport') private wallViewport?: ElementRef<HTMLElement>;
  @ViewChild('wallTrack') private wallTrack?: ElementRef<HTMLElement>;

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  protected readonly wallNotices = signal<BoardAnnouncement[]>([]);
  readonly scrubVisible = signal(false);
  readonly thumbTop = signal('0%');

  readonly marqueeCards = computed(() => {
    const items = this.thankService.wall();
    const cards: { trackId: string; item: PublicDonationThank }[] = [];
    for (let pass = 0; pass < 2; pass += 1) {
      for (const item of items) {
        cards.push({ trackId: `${pass}-${item.id}`, item });
      }
    }
    return cards;
  });

  private resumeTimer: number | null = null;
  private hideScrubTimer: number | null = null;
  private rafId = 0;
  private lastFrame = 0;
  private looping = false;
  private paused = false;
  private offsetY = 0;
  private loopHeight = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragStartOffset = 0;
  private readonly pxPerSecond = 26;

  constructor() {
    effect(() => {
      if (!this.isLoading() && this.thankService.wall().length > 0) {
        queueMicrotask(() => {
          this.measureLoop();
          this.ensureLoop();
        });
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const notices = await this.thankService.loadWall().then(() => this.boards.published('thank_wall'));
      this.wallNotices.set(normalizeThankWallNotices(notices));
    } catch {
      this.errorText.set('無法載入感謝牆，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.measureLoop();
    this.ensureLoop();
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.looping = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.unbindDragListeners();
  }

  onWheel(event: WheelEvent): void {
    if (!this.thankService.wall().length) {
      return;
    }
    event.preventDefault();
    this.enterManual();
    this.setOffset(this.offsetY - event.deltaY);
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.thankService.wall().length || event.touches.length !== 1) {
      return;
    }
    this.enterManual();
    this.dragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragStartOffset = this.offsetY;
    this.bindDragListeners();
  }

  onScrubPointerDown(event: PointerEvent): void {
    if (!this.thankService.wall().length) {
      return;
    }
    event.preventDefault();
    const rail = event.currentTarget as HTMLElement;
    this.enterManual();
    this.jumpFromScrub(rail, event.clientY);
    this.dragging = true;
    this.dragStartY = event.clientY;
    this.dragStartOffset = this.offsetY;
    rail.setPointerCapture(event.pointerId);
    this.bindDragListeners();
  }

  private onPointerMove = (event: PointerEvent | TouchEvent): void => {
    if (!this.dragging) {
      return;
    }
    const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;
    if (clientY == null) {
      return;
    }
    if ('touches' in event) {
      event.preventDefault();
    }
    this.setOffset(this.dragStartOffset + (clientY - this.dragStartY));
  };

  private onPointerUp = (): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.unbindDragListeners();
    this.scheduleResume();
  };

  private bindDragListeners(): void {
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('touchmove', this.onPointerMove, { passive: false });
    window.addEventListener('touchend', this.onPointerUp, { passive: true });
    window.addEventListener('touchcancel', this.onPointerUp, { passive: true });
  }

  private unbindDragListeners(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('touchmove', this.onPointerMove);
    window.removeEventListener('touchend', this.onPointerUp);
    window.removeEventListener('touchcancel', this.onPointerUp);
  }

  private enterManual(): void {
    this.paused = true;
    this.zone.run(() => this.scrubVisible.set(true));
    this.updateThumb();
    this.scheduleResume();
  }

  private scheduleResume(): void {
    if (this.resumeTimer != null) {
      window.clearTimeout(this.resumeTimer);
    }
    if (this.hideScrubTimer != null) {
      window.clearTimeout(this.hideScrubTimer);
    }
    this.resumeTimer = window.setTimeout(() => {
      this.paused = false;
      this.hideScrubTimer = window.setTimeout(() => {
        this.zone.run(() => this.scrubVisible.set(false));
      }, 280);
    }, 4200);
  }

  private clearTimers(): void {
    if (this.resumeTimer != null) {
      window.clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
    if (this.hideScrubTimer != null) {
      window.clearTimeout(this.hideScrubTimer);
      this.hideScrubTimer = null;
    }
  }

  private jumpFromScrub(rail: HTMLElement, clientY: number): void {
    const rect = rail.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / Math.max(rect.height, 1)));
    this.setOffset(-ratio * this.maxTravel());
  }

  private maxTravel(): number {
    const viewport = this.wallViewport?.nativeElement;
    if (!viewport || this.loopHeight <= 0) {
      return 0;
    }
    return Math.max(this.loopHeight - viewport.clientHeight, 0);
  }

  private setOffset(next: number): void {
    this.measureLoop();
    const loop = this.loopHeight;
    if (loop <= 0) {
      this.offsetY = 0;
      this.applyTransform();
      return;
    }

    let value = next;
    while (value <= -loop) {
      value += loop;
    }
    while (value > 0) {
      value -= loop;
    }
    this.offsetY = value;
    this.applyTransform();
    this.updateThumb();
  }

  private measureLoop(): void {
    const track = this.wallTrack?.nativeElement;
    if (!track || track.scrollHeight <= 0) {
      this.loopHeight = 0;
      return;
    }
    this.loopHeight = track.scrollHeight / 2;
  }

  private applyTransform(): void {
    const track = this.wallTrack?.nativeElement;
    if (!track) {
      return;
    }
    track.style.transform = `translate3d(0, ${this.offsetY}px, 0)`;
  }

  private updateThumb(): void {
    if (!this.scrubVisible()) {
      return;
    }
    const travel = this.maxTravel();
    const progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -this.offsetY / travel));
    const next = `${progress * 100}%`;
    if (next !== this.thumbTop()) {
      this.zone.run(() => this.thumbTop.set(next));
    }
  }

  private ensureLoop(): void {
    if (this.looping) {
      return;
    }
    this.looping = true;
    this.lastFrame = performance.now();
    this.zone.runOutsideAngular(() => {
      const step = (now: number) => {
        if (!this.looping) {
          return;
        }
        const elapsed = Math.min(now - this.lastFrame, 64);
        this.lastFrame = now;
        if (!this.paused && this.thankService.wall().length > 0) {
          this.measureLoop();
          const viewH = this.wallViewport?.nativeElement.clientHeight ?? 0;
          if (this.loopHeight > viewH) {
            this.offsetY -= (this.pxPerSecond * elapsed) / 1000;
            if (this.offsetY <= -this.loopHeight) {
              this.offsetY += this.loopHeight;
            }
            this.applyTransform();
          }
        }
        this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    });
  }
}
