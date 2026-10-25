import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { AGENCY_APPLICATION_READER, AGENCY_REVIEW_WRITER } from '../../../core/services/agency-verification/agency-review.ports';
import {
  AgencyApplication,
  ReviewStatus,
} from '../../../core/services/agency-verification/agency-verification.service';
import { AgencyApplicationQuery, AgencyListFilter } from './agency-application-query';
import { AgencyReviewDetailComponent } from './agency-review-detail.component';
import { AgencyReviewListComponent } from './agency-review-list.component';
import { provideAgencyReviewPorts } from './agency-review.providers';
import { agencyReviewLabel } from './agency-review-status';

@Component({
  selector: 'app-admin-agency-verify',
  imports: [AgencyReviewListComponent, AgencyReviewDetailComponent],
  providers: provideAgencyReviewPorts(),
  templateUrl: './admin-agency-verify.component.html',
  styleUrl: './admin-agency-verify.component.scss',
})
export class AdminAgencyVerifyComponent implements OnInit {
  private readonly applicationsSource = inject(AGENCY_APPLICATION_READER);
  private readonly reviews = inject(AGENCY_REVIEW_WRITER);
  private readonly changes = inject(ChangeDetectorRef);
  private readonly query = new AgencyApplicationQuery();

  protected applications: AgencyApplication[] = [];
  protected searchKeyword = '';
  protected selectedStatus: AgencyListFilter = 'all';
  protected selectedApplication: AgencyApplication | null = null;
  protected loadError = '';
  protected cancellingId = '';

  ngOnInit(): void {
    void this.reload();
  }

  protected filteredApplications(): AgencyApplication[] {
    return this.query.filter(this.applications, this.searchKeyword, this.selectedStatus);
  }

  protected count(status: ReviewStatus): number {
    return this.query.count(this.applications, status);
  }

  protected toggleStatus(status: ReviewStatus): void {
    this.selectedStatus = this.selectedStatus === status ? 'all' : status;
  }

  protected openApplication(application: AgencyApplication): void {
    this.selectedApplication = application;
  }

  protected closeApplication(): void {
    this.selectedApplication = null;
  }

  protected async reviewApplication(decision: {
    application: AgencyApplication;
    status: Exclude<ReviewStatus, 'pending'>;
    note: string;
  }): Promise<void> {
    const saved = await this.reviews.updateStatus(decision.application.id, decision.status, decision.note);
    if (!saved) {
      window.alert('儲存審核結果失敗，請稍後再試。');
      this.changes.detectChanges();
      return;
    }

    window.alert(`「${decision.application.name}」的審核狀態已更新為「${agencyReviewLabel(decision.status)}」。`);
    this.closeApplication();
    await this.reload();
  }

  protected async cancelAccount(request: { application: AgencyApplication; note: string }): Promise<void> {
    if (this.cancellingId) {
      return;
    }

    this.cancellingId = request.application.id;
    this.changes.detectChanges();
    const saved = await this.reviews.cancelAccount(request.application.id, request.note);
    this.cancellingId = '';

    if (!saved) {
      window.alert('註銷失敗，請稍後再試。');
      this.changes.detectChanges();
      return;
    }

    window.alert(`「${request.application.name}」已註銷。`);
    if (this.selectedApplication?.id === request.application.id) {
      this.closeApplication();
    }
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      this.applications = await this.applicationsSource.list();
      this.loadError = '';
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : '無法載入機構審核名單。';
    } finally {
      this.changes.detectChanges();
    }
  }
}
