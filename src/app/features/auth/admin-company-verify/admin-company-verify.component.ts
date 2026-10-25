import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CompanyReviewStatus } from '../../../models/auth/app-role';
import {
  CompanyApplication,
  CompanyVerificationService,
} from '../../../core/services/auth/company-verification.service';

@Component({
  selector: 'app-admin-company-verify',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-company-verify.component.html',
  styleUrl: './admin-company-verify.component.scss',
})
export class AdminCompanyVerifyComponent implements OnInit {
  private readonly reviews = inject(CompanyVerificationService);

  protected readonly applications = signal<CompanyApplication[]>([]);
  protected readonly selected = signal<CompanyApplication | null>(null);
  protected readonly errorText = signal('');
  protected readonly loading = signal(true);
  protected reviewNote = '';
  protected filter: 'all' | CompanyReviewStatus = 'all';
  protected checkedRegistry = false;
  protected checkedCalled = false;
  protected checkedRepresentative = false;
  protected readonly registryUrl = 'https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected visible(): CompanyApplication[] {
    const filter = this.filter;
    return this.applications().filter((item) => filter === 'all' || item.status === filter);
  }

  protected statusLabel(status: CompanyReviewStatus): string {
    const labels: Record<CompanyReviewStatus, string> = {
      pending: '待審核',
      approved: '已通過',
      rejected: '未通過',
      supplement: '待補件',
    };
    return labels[status];
  }

  protected open(item: CompanyApplication): void {
    this.selected.set(item);
    this.reviewNote = item.reviewNote;
    this.checkedRegistry = false;
    this.checkedCalled = false;
    this.checkedRepresentative = false;
    this.errorText.set('');
  }

  protected close(): void {
    this.selected.set(null);
    this.reviewNote = '';
    this.checkedRegistry = false;
    this.checkedCalled = false;
    this.checkedRepresentative = false;
  }

  protected phoneChecksDone(): boolean {
    return this.checkedRegistry && this.checkedCalled && this.checkedRepresentative;
  }

  protected async decide(status: Exclude<CompanyReviewStatus, 'pending'>): Promise<void> {
    const current = this.selected();
    if (!current) {
      return;
    }

    if (status === 'approved' && !this.phoneChecksDone()) {
      this.errorText.set('通過前要先查公開公司登記、致電確認有提出申請，並核對代表人。');
      return;
    }

    if (!this.reviewNote.trim()) {
      this.errorText.set(status === 'approved' ? '請寫下通話對象與確認結果。' : '未通過或補件時，請填寫原因。');
      return;
    }

    this.errorText.set('');

    const note = status === 'approved' ? `已查公開公司登記並致電確認。${this.reviewNote.trim()}` : this.reviewNote.trim();

    try {
      await this.reviews.review(current.userId, status, note);
      this.close();
      await this.reload();
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '審核失敗。');
    }
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.applications.set(await this.reviews.list());
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '無法載入名單。');
    } finally {
      this.loading.set(false);
    }
  }
}
