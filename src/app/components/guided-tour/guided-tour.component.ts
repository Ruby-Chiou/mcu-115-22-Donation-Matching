import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';

import { GuidedTourService } from '../../core/services/guided-tour/guided-tour.service';

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GuidedTourComponent {
  protected readonly tour = inject(GuidedTourService);
  protected readonly tipStyle = signal<Record<string, string>>({
    top: 'auto',
    bottom: '20px',
    left: '16px',
    right: 'auto',
  });
  protected readonly spotlight = signal<Record<string, string> | null>(null);

  constructor() {
    effect(() => {
      const step = this.tour.currentStep();
      const active = this.tour.isActive();
      const highlighted = this.tour.highlighted();
      if (!active || !step) {
        this.spotlight.set(null);
        this.clearTourHighlights();
        return;
      }
      queueMicrotask(() => this.placeNearAnchor(highlighted || step.anchor));
    });
  }

  private placeNearAnchor(selector: string): void {
    this.clearTourHighlights();
    const node = this.findAnchor(selector);
    if (!node || typeof window === 'undefined') {
      this.spotlight.set(null);
      this.tipStyle.set({
        top: 'auto',
        bottom: '20px',
        left: '16px',
        right: 'auto',
      });
      return;
    }

    node.classList.add('tour-target-active');
    const rect = node.getBoundingClientRect();
    this.spotlight.set({
      top: `${Math.max(8, rect.top - 6)}px`,
      left: `${Math.max(8, rect.left - 6)}px`,
      width: `${rect.width + 12}px`,
      height: `${rect.height + 12}px`,
    });

    const tipWidth = Math.min(320, window.innerWidth - 24);
    const preferBelow = rect.bottom + 200 < window.innerHeight;
    const top = preferBelow ? Math.min(window.innerHeight - 210, rect.bottom + 12) : Math.max(12, rect.top - 190);
    let left = Math.min(Math.max(12, rect.left), window.innerWidth - tipWidth - 12);
    if (window.innerWidth < 768) {
      left = 12;
    }

    this.tipStyle.set({
      top: `${top}px`,
      bottom: 'auto',
      left: `${left}px`,
      right: 'auto',
      width: `${tipWidth}px`,
    });

    node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  private findAnchor(selector: string): HTMLElement | null {
    for (const part of selector.split(',').map((item) => item.trim())) {
      const found = document.querySelector(part);
      if (found instanceof HTMLElement) {
        const style = window.getComputedStyle(found);
        if (style.display === 'none' || style.visibility === 'hidden') {
          continue;
        }
        return found;
      }
    }
    return null;
  }

  private clearTourHighlights(): void {
    document.querySelectorAll('.tour-target-active').forEach((node) => node.classList.remove('tour-target-active'));
  }
}
