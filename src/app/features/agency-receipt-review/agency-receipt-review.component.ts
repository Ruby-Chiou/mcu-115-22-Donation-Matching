import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AgencyReceiptIssuanceService } from '../../core/services/agency/agency-receipt-issuance.service';
import { DonationRecordLinksComponent } from '../agency-record-links/donation-record-links.component';
import {
  AgencyReceiptTask,
  RECEIPT_TASK_FILTER_OPTIONS,
  ReceiptTaskFilter,
} from '../../models/agency/receipt-issuance';

@Component({
  selector: 'app-agency-receipt-review',
  imports: [DatePipe, FormsModule, RouterLink, DonationRecordLinksComponent],
  templateUrl: './agency-receipt-review.component.html',
  styleUrl: './agency-receipt-review.component.scss',
})
export class AgencyReceiptReviewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly issuanceService = inject(AgencyReceiptIssuanceService);

  readonly filterOptions = RECEIPT_TASK_FILTER_OPTIONS;

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly notice = signal('');
  readonly activeFilter = signal<ReceiptTaskFilter>('ALL');
  readonly keyword = signal('');
  readonly linkedId = signal(this.route.snapshot.queryParamMap.get('donation') ?? '');

  readonly uploadTask = signal<AgencyReceiptTask | null>(null);
  readonly isUploading = signal(false);
  readonly certificateNote = signal('');
  readonly certificateAgencyName = signal(this.issuanceService.defaultAgencyName);
  readonly selectedFileName = signal('');

  private selectedFile: File | null = null;

  readonly filteredTasks = computed(() => {
    const filter = this.activeFilter();
    const keyword = this.keyword().trim().toLowerCase();

    return this.issuanceService.tasks().filter((task) => {
      if (filter === 'UNFINISHED' && !this.issuanceService.isPending(task)) {
        return false;
      }

      if (filter === 'NEED_RECEIPT' && !(task.needReceipt && !task.receiptIssued)) {
        return false;
      }

      if (filter === 'NEED_CERTIFICATE' && !(task.needThankYou && !task.certificateUploaded)) {
        return false;
      }

      if (filter === 'DONE' && !this.issuanceService.isDone(task)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [task.donorName, task.actualMaterial, task.demandItem, task.phone, task.receiptTitle, task.receiptNo ?? ''].some((text) =>
        text.toLowerCase().includes(keyword)
      );
    });
  });

  readonly pendingCount = computed(() => this.issuanceService.tasks().filter((task) => this.issuanceService.isPending(task)).length);

  readonly linkedMissing = computed(() => {
    const id = this.linkedId();
    return !!id && !this.isLoading() && !this.issuanceService.tasks().some((task) => task.donationId === id);
  });

  async ngOnInit(): Promise<void> {
    const notice = history.state?.notice;

    if (typeof notice === 'string' && notice) {
      this.notice.set(notice);
    }

    try {
      await this.issuanceService.loadTasks();
    } catch {
      this.errorText.set('無法載入待核發清單，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
      this.revealLinkedRow();
    }
  }

  private revealLinkedRow(): void {
    const linkedId = this.linkedId();
    if (!linkedId) {
      return;
    }

    const listed = this.issuanceService.tasks().some((task) => task.donationId === linkedId);
    const visible = this.filteredTasks().some((task) => task.donationId === linkedId);
    if (listed && !visible) {
      this.activeFilter.set('ALL');
      this.keyword.set('');
    }

    setTimeout(() => {
      const row = document.getElementById(`donation-${linkedId}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  }

  setFilter(filter: ReceiptTaskFilter): void {
    this.activeFilter.set(filter);
  }

  onKeywordInput(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }

  goToEdit(task: AgencyReceiptTask): void {
    void this.router.navigate(['/agency/receipt-review', task.donationId, 'edit']);
  }

  goToPreview(task: AgencyReceiptTask): void {
    void this.router.navigate(['/agency/receipt-review', task.donationId, 'preview'], {
      state: { draft: null },
    });
  }

  openUpload(task: AgencyReceiptTask): void {
    this.uploadTask.set(task);
    this.certificateAgencyName.set(this.issuanceService.defaultAgencyName);
    this.certificateNote.set('');
    this.selectedFile = null;
    this.selectedFileName.set('');
    this.errorText.set('');
  }

  closeUpload(): void {
    if (this.isUploading()) {
      return;
    }

    this.uploadTask.set(null);
  }

  onCertificateSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile = file;
    this.selectedFileName.set(file?.name ?? '');
  }

  async uploadCertificate(): Promise<void> {
    const task = this.uploadTask();

    if (!task) {
      return;
    }

    if (!this.selectedFile) {
      this.errorText.set('請先選擇感謝狀檔案（PDF 或圖片）。');
      return;
    }

    this.isUploading.set(true);
    this.notice.set('');
    this.errorText.set('');

    try {
      await this.issuanceService.uploadCertificate(task, this.certificateAgencyName(), this.selectedFile, this.certificateNote());
      this.notice.set('感謝狀已上傳，捐助者可於會員專區「捐贈回饋」查看。');
      this.uploadTask.set(null);
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '上傳感謝狀失敗，請稍後再試。');
    } finally {
      this.isUploading.set(false);
    }
  }

  receiptStatus(task: AgencyReceiptTask): string {
    if (!task.needReceipt) {
      return '未申請';
    }

    return task.receiptIssued ? '已開立' : '待開立';
  }

  certificateStatus(task: AgencyReceiptTask): string {
    if (!task.needThankYou) {
      return '未申請';
    }

    return task.certificateUploaded ? '已上傳' : '待上傳';
  }
}
