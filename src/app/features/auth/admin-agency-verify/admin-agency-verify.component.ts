import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'supplement';

interface AgencyApplication {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  registrationNumber: string;
  submittedAt: string;
  documentName: string;
  status: ReviewStatus;
  reviewNote: string;
}

@Component({
  selector: 'app-admin-agency-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-agency-verify.component.html',
  styleUrl: './admin-agency-verify.component.scss',
})
export class AdminAgencyVerifyComponent implements OnInit {
  private readonly storageKey = 'beneficiary-verification-applications';

  searchKeyword = '';
  selectedStatus = 'all';
  selectedApplication: AgencyApplication | null = null;
  reviewReason = '';

  applications: AgencyApplication[] = [
    {
      id: 1,
      name: '暖陽社會福利協會',
      contact: '林小姐',
      phone: '02-2345-6789',
      email: 'service@example.org',
      registrationNumber: '府社團字第115001號',
      submittedAt: '2026-10-14',
      documentName: '社福機構立案證明.pdf',
      status: 'pending',
      reviewNote: '',
    },
    {
      id: 2,
      name: '愛心關懷基金會',
      contact: '陳先生',
      phone: '03-456-7890',
      email: 'care@example.org',
      registrationNumber: '府社字第115002號',
      submittedAt: '2026-10-13',
      documentName: '基金會立案證明.pdf',
      status: 'pending',
      reviewNote: '',
    },
    {
      id: 3,
      name: '希望兒少關懷中心',
      contact: '王小姐',
      phone: '04-2222-3333',
      email: 'hope@example.org',
      registrationNumber: '府社福字第114023號',
      submittedAt: '2026-10-10',
      documentName: '機構登記文件.pdf',
      status: 'approved',
      reviewNote: '資格文件已確認。',
    },
    {
      id: 4,
      name: '安心社區服務協會',
      contact: '張先生',
      phone: '07-333-4567',
      email: 'community@example.org',
      registrationNumber: '府社團字第115008號',
      submittedAt: '2026-10-09',
      documentName: '立案證明.pdf',
      status: 'supplement',
      reviewNote: '請重新上傳清晰完整的立案證明。',
    },
  ];

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * 從瀏覽器讀取已儲存的申請資料。
   * 如果尚未有儲存紀錄，就使用上方的範例資料。
   */
  private loadApplications(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);

      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return;
      }

      this.applications = parsed as AgencyApplication[];
    } catch (error) {
      console.error('讀取審核資料失敗：', error);
    }
  }

  /**
   * 將目前申請資料儲存至瀏覽器。
   */
  private saveApplications(): boolean {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.applications)
      );

      return true;
    } catch (error) {
      console.error('儲存審核資料失敗：', error);
      window.alert('儲存失敗，請確認瀏覽器是否允許網站儲存資料。');
      return false;
    }
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
        ].some((value) => value.toLowerCase().includes(keyword));

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
    if (!this.selectedApplication) {
      return;
    }

    if (status === 'pending') {
      return;
    }

    if (
      status !== 'approved' &&
      !this.reviewReason.trim()
    ) {
      window.alert('請填寫審核原因，再進行此操作。');
      return;
    }

    const application = this.applications.find(
      (item) => item.id === this.selectedApplication?.id
    );

    if (!application) {
      return;
    }

    const previousStatus = application.status;
    const previousNote = application.reviewNote;

    application.status = status;
    application.reviewNote =
      status === 'approved'
        ? '資格文件已確認。'
        : this.reviewReason.trim();

    // 儲存失敗時還原資料，避免畫面顯示已完成但實際沒有儲存。
    if (!this.saveApplications()) {
      application.status = previousStatus;
      application.reviewNote = previousNote;
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
