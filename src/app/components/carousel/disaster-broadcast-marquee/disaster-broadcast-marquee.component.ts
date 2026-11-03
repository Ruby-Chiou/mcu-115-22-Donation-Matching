import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

@Component({
  selector: 'app-disaster-broadcast-marquee',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './disaster-broadcast-marquee.component.html',
  styleUrl: './disaster-broadcast-marquee.component.scss',
})
export class DisasterBroadcastMarqueeComponent implements OnDestroy {
  private readonly disasterControl = inject(DisasterControlService);
  protected readonly visible = signal(false);
  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    let initialized = false;
    effect(() => {
      this.disasterControl.openBroadcast();
      if (!initialized) {
        initialized = true;
        return;
      }
      this.replay();
    });
  }

  protected finish(): void {
    this.visible.set(false);
  }

  private replay(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.visible.set(false);
    queueMicrotask(() => this.visible.set(true));
    this.hideTimer = setTimeout(() => this.visible.set(false), 22000);
  }

  ngOnDestroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
  }
}
