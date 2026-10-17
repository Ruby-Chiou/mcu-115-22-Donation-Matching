
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AgencyApplication,
  AgencyVerificationService,
  ReviewStatus,
} from '../../../core/services/agency-verification/agency-verification.service';

@Component({
  selector: 'app-admin-agency-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-agency-verify.component.html',
  styleUrl: './admin-agency-verify.component.scss',
})
export class AdminAgencyVerifyComponent implements OnInit {
  searchKeyword = '';
  selectedStatus = 'all';
  selectedApplication: AgencyApplication | null = null;
  reviewReason = '';

  applications: AgencyApplication[] = [];

  constructor(
    private readonly agencyVerificationService: AgencyVerificationService
  ) {}

  ngOnInit(): void {
    this.applications =
      this.agencyVerificationService.getApplications();
  }

  get filteredApplications(): AgencyApplication[] {
    const keyword = this.searchKeyword.trim().toLowerCase();

    return this.applications.filter((application) => {
      const matchesKeyword =
        !keyword ||
        [
          application.name,
          application.contact,
          application.phone,
          application.email,
          application.registrationNumber,
        ].some((value) =>
          value.toLowerCase().includes(keyword)
        );

      const matchesStatus =
        this.selectedStatus === 'all' ||
        application.status === this.selectedStatus;

      return matchesKeyword && matchesStatus;
    });
  }

  get pendingCount(): number {
    return this.applications.filter(
      (application) => application.status === 'pending'
    ).length;
  }

  get approvedCount(): number {
    return this.applications.filter(
      (application) => application.status === 'approved'
    ).length;
  }

  get supplementCount(): number {
    return this.applications.filter(
      (application) => application.status === 'supplement'
    ).length;
  }

  get rejectedCount(): number {
    return this.applications.filter(
      (application) => application.status === 'rejected'
    ).length;
  }

  getStatusLabel(status: ReviewStatus): string {
    const labels: Record<ReviewStatus, string> = {
      pending: '待審核',
      approved: '已驗證',
      rejected: '未通過',
      supplement: '待補件',
    };

    return labels[status];
  }

  openApplication(application: AgencyApplication): void {
    this.selectedApplication = application;
    this.reviewReason = application.reviewNote;
  }

  closeApplication(): void {
    this.selectedApplication = null;
    this.reviewReason = '';
  }

  reviewApplication(status: ReviewStatus): void {
    if (!this.selectedApplication || status === 'pending') {
      return;
    }

    if (status !== 'approved' && !this.reviewReason.trim()) {
      window.alert('請填寫審核原因，再進行此操作。');
      return;
    }

    const application = this.selectedApplication;

    const note =
      status === 'approved'
        ? '資格文件已確認。'
        : this.reviewReason.trim();

    const saved = this.agencyVerificationService.updateStatus(
      application.id,
      status,
      note
    );

    if (!saved) {
      window.alert('儲存審核結果失敗，請稍後再試。');
      return;
    }

    window.alert(
      `「${application.name}」的審核狀態已更新為「${this.getStatusLabel(status)}」。`
    );

    this.closeApplication();
  }

  trackById(
    _index: number,
    application: AgencyApplication
  ): number {
    return application.id;
  }
}
