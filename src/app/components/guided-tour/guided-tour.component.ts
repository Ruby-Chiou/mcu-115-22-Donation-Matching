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
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.measureAnchor(selector));
    });
    window.setTimeout(() => this.measureAnchor(selector), 220);
    window.setTimeout(() => this.measureAnchor(selector), 480);
  }

  private measureAnchor(selector: string): void {
    const node = this.findAnchor(selector);
    if (!node || !this.tour.isActive()) {
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
    const tipHeight = 210;
    const gap = 14;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    let top = rect.bottom + gap;
    let left = Math.min(Math.max(12, rect.left), window.innerWidth - tipWidth - 12);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    // 優先放在錨點右側，避免蓋住正在介紹的卡片內容。
    if (!isMobile && spaceRight >= tipWidth + gap + 8) {
      left = Math.min(rect.right + gap, window.innerWidth - tipWidth - 12);
      top = Math.min(Math.max(12, rect.top), window.innerHeight - tipHeight - 12);
    } else if (!isMobile && spaceLeft >= tipWidth + gap + 8) {
      left = Math.max(12, rect.left - tipWidth - gap);
      top = Math.min(Math.max(12, rect.top), window.innerHeight - tipHeight - 12);
    } else if (spaceBelow >= tipHeight + gap || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + gap, window.innerHeight - tipHeight - 12);
      if (isMobile || isTablet) {
        left = 12;
      }
    } else {
      top = Math.max(12, rect.top - tipHeight - gap);
      if (isMobile || isTablet) {
        left = 12;
      }
    }

    // 最後再夾進可視範圍，避免第一步卡出版面。
    top = Math.min(Math.max(12, top), window.innerHeight - tipHeight - 12);
    left = Math.min(Math.max(12, left), window.innerWidth - tipWidth - 12);

    this.tipStyle.set({
      top: `${top}px`,
      bottom: 'auto',
      left: `${left}px`,
      right: 'auto',
      width: `${tipWidth}px`,
    });
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
