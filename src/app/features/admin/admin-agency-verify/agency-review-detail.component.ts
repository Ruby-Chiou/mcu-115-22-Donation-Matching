import { ChangeDetectorRef, Component, OnDestroy, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AGENCY_DOCUMENT_READER } from '../../../core/services/agency-verification/agency-review.ports';
import {
  AgencyApplication,
  ReviewStatus,
} from '../../../core/services/agency-verification/agency-verification.service';
import {
  PUBLIC_WELFARE_REGISTRIES,
  PublicRegistryCheck,
  approvalReady,
  approvedReviewNote,
  reviewDecisionError,
} from './agency-approval-policy';
import { agencyStatusClass, agencyStatusText } from './agency-review-status';
import { VerificationDocumentPreview } from './verification-document-preview';

@Component({
  selector: 'app-agency-review-detail',
  imports: [FormsModule],
  templateUrl: './agency-review-detail.component.html',
  styleUrl: './agency-review-detail.component.scss',
})
export class AgencyReviewDetailComponent implements OnDestroy {
  private readonly documents = inject(AGENCY_DOCUMENT_READER);
  private readonly changes = inject(ChangeDetectorRef);
  private seenId = '';

  readonly application = input.required<AgencyApplication>();
  readonly cancelling = input(false);
  readonly closed = output<void>();
  readonly reviewed = output<{ application: AgencyApplication; status: Exclude<ReviewStatus, 'pending'>; note: string }>();
  readonly cancelled = output<{ application: AgencyApplication; note: string }>();

  protected readonly registries = PUBLIC_WELFARE_REGISTRIES;
  protected readonly preview = new VerificationDocumentPreview();
  protected reviewReason = '';
  protected documentError = '';
  protected openingDocument = false;
  protected decisionError = '';
  protected organizationFound = false;
  protected calledPublishedPhone = false;
  protected registrantConfirmed = false;

  constructor() {
    effect(() => {
      const current = this.application();
      if (current.id === this.seenId) {
        return;
      }

      this.seenId = current.id;
      this.reviewReason = current.reviewNote;
      this.organizationFound = false;
      this.calledPublishedPhone = false;
      this.registrantConfirmed = false;
      this.documentError = '';
      this.decisionError = '';
      this.preview.clear();
    });
  }

  ngOnDestroy(): void {
    this.preview.clear();
  }

  protected statusText(application: AgencyApplication): string {
    return agencyStatusText(application);
  }

  protected statusClass(application: AgencyApplication): string {
    return agencyStatusClass(application);
  }

  protected checks(): PublicRegistryCheck {
    return {
      organizationFound: this.organizationFound,
      calledPublishedPhone: this.calledPublishedPhone,
      registrantConfirmed: this.registrantConfirmed,
    };
  }

  protected canApprove(application: AgencyApplication): boolean {
    return application.accountStatus !== 'DELETED' && approvalReady(this.checks()) && this.reviewReason.trim().length > 0;
  }

  protected async openDocument(): Promise<void> {
    const application = this.application();
    if (!application.documentStored || this.openingDocument) {
      return;
    }

    this.openingDocument = true;
    this.documentError = '';
    this.changes.detectChanges();

    try {
      this.preview.show(await this.documents.readFile(application.id));
    } catch (error) {
      this.documentError = error instanceof Error ? error.message : '無法開啟證明文件。';
    } finally {
      this.openingDocument = false;
      this.changes.detectChanges();
    }
  }

  protected decide(status: Exclude<ReviewStatus, 'pending'>): void {
    const application = this.application();
    if (application.accountStatus === 'DELETED') {
      return;
    }

    const error = reviewDecisionError(status, this.checks(), this.reviewReason);
    this.decisionError = error ?? '';
    if (error) {
      return;
    }

    const note = status === 'approved' ? approvedReviewNote(this.reviewReason) : this.reviewReason.trim();
    this.reviewed.emit({ application, status, note });
  }

  protected requestCancel(): void {
    const application = this.application();
    const note = this.reviewReason.trim();
    if (application.accountStatus === 'DELETED' || this.cancelling() || !note) {
      return;
    }

    const confirmed = window.confirm(`確定註銷「${application.name}」？註銷後不能再登入，民眾頁也不再顯示這個機構。`);
    if (!confirmed) {
      return;
    }

    this.cancelled.emit({ application, note });
  }
}
