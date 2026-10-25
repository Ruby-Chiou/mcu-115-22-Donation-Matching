import { Component, EventEmitter, OnDestroy, Output, input, signal } from '@angular/core';

import { CertificateCard } from '../../../core/auth/agency-certificate.registry';

type CertificateStep = 'connect' | 'review' | 'confirm' | 'done';

@Component({
  selector: 'app-natural-person-gate',
  templateUrl: './natural-person-gate.component.html',
  styleUrl: './natural-person-gate.component.scss',
})
export class NaturalPersonGateComponent implements OnDestroy {
  readonly certificates = input.required<CertificateCard[]>();
  readonly successText = input('憑證驗證成功，正在進入社福機構總控制台。');

  @Output() verified = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly step = signal<CertificateStep>('connect');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly transactionNo = `MOI${Date.now().toString().slice(-10)}`;
  protected readonly requestedAt = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  private timer = 0;

  constructor() {
    this.timer = window.setTimeout(() => this.step.set('review'), 1400);
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.timer);
  }

  protected choose(id: string): void {
    this.selectedId.set(id);
  }

  protected confirmWithBiometric(): void {
    if (this.step() !== 'review') {
      return;
    }

    const selected = this.activeCertificate();
    if (!selected) {
      return;
    }

    this.step.set('confirm');
    this.timer = window.setTimeout(() => {
      this.step.set('done');
      this.timer = window.setTimeout(() => this.verified.emit(selected.id), 650);
    }, 1300);
  }

  protected activeCertificate(): CertificateCard | null {
    const cards = this.certificates();
    if (cards.length === 1) {
      return cards[0];
    }

    return cards.find((item) => item.id === this.selectedId()) ?? null;
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
