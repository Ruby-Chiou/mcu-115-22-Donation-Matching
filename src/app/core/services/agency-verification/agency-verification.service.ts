
import { Injectable } from '@angular/core';

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'supplement';

export interface AgencyApplication {
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

@Injectable({
  providedIn: 'root',
})
export class AgencyVerificationService {
  private readonly storageKey = 'beneficiary-verification-applications';

  private applications: AgencyApplication[] = [
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

  constructor() {
    this.loadApplications();
  }

  /** 取得目前所有申請資料 */
  getApplications(): AgencyApplication[] {
    return this.applications;
  }

  /** 從瀏覽器讀取已儲存的資料 */
  private loadApplications(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);

      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        this.applications = parsed as AgencyApplication[];
      }
    } catch (error) {
      console.error('讀取機構審查資料失敗：', error);
    }
  }

  /** 儲存資料至瀏覽器 */
  private saveApplications(): boolean {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.applications)
      );
      return true;
    } catch (error) {
      console.error('儲存機構審查資料失敗：', error);
      return false;
    }
  }

  /** 更新審查狀態與備註 */
  updateStatus(
    id: number,
    status: ReviewStatus,
    reviewNote: string
  ): boolean {
    const application = this.applications.find(
      (item) => item.id === id
    );

    if (!application) {
      return false;
    }

    const previousStatus = application.status;
    const previousNote = application.reviewNote;

    application.status = status;
    application.reviewNote = reviewNote;

    if (!this.saveApplications()) {
      application.status = previousStatus;
      application.reviewNote = previousNote;
      return false;
    }

    return true;
  }

  /** 機構重新提交資料後，將狀態改回待審核 */
  resubmitApplication(
    id: number,
    documentName?: string
  ): boolean {
    const application = this.applications.find(
      (item) => item.id === id
    );

    if (!application) {
      return false;
    }

    const previousStatus = application.status;
    const previousNote = application.reviewNote;
    const previousDocumentName = application.documentName;
    const previousSubmittedAt = application.submittedAt;

    application.status = 'pending';
    application.reviewNote = '';
    application.submittedAt = new Date().toISOString().slice(0, 10);

    if (documentName) {
      application.documentName = documentName;
    }

    if (!this.saveApplications()) {
      application.status = previousStatus;
      application.reviewNote = previousNote;
      application.documentName = previousDocumentName;
      application.submittedAt = previousSubmittedAt;
      return false;
    }

    return true;
  }
}
