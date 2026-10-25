import { Injectable, inject } from '@angular/core';

import type {
  AgencyApplicationReader,
  AgencyDocumentReader,
  AgencyReviewWriter,
} from './agency-review.ports';
import { SupabaseService } from '../database/supabase.service';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'supplement';

export interface AgencyApplication {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  representative: string;
  phone: string;
  defaultAddress: string;
  contact: string;
  contactPersonTitle: string;
  department: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  consentToContact: boolean;
  agreeToTerms: boolean;
  submittedAt: string;
  documentName: string;
  documentStored: boolean;
  status: ReviewStatus;
  accountStatus: string;
  reviewNote: string;
}

export interface AgencyVerificationFile {
  fileName: string;
  contentType: string;
  bodyBase64: string;
}

interface AgencyReviewRow {
  uid: string;
  email: string | null;
  agencyName: string | null;
  registrationNumber: string | null;
  representative: string | null;
  contactPhone: string | null;
  defaultAddress: string | null;
  contactPersonName: string | null;
  contactPersonTitle: string | null;
  department: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  verificationDocumentUrl: string | null;
  consentToContact: boolean | null;
  agreeToTerms: boolean | null;
  verificationStatus: string | null;
  accountStatus: string | null;
  reviewNote: string | null;
  createdAt: string | null;
}

const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const FILE_LIMIT = 8 * 1024 * 1024;

@Injectable({
  providedIn: 'root',
})
export class AgencyVerificationService implements AgencyApplicationReader, AgencyReviewWriter, AgencyDocumentReader {
  private readonly supabase = inject(SupabaseService);

  async list(): Promise<AgencyApplication[]> {
    const { data, error } = await this.supabase.client
      .from('agency_profiles')
      .select(
        'uid, email, agencyName, registrationNumber, representative, contactPhone, defaultAddress, contactPersonName, contactPersonTitle, department, contactPersonPhone, contactPersonEmail, verificationDocumentUrl, consentToContact, agreeToTerms, verificationStatus, accountStatus, reviewNote, createdAt',
      )
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('讀取機構審核名單失敗：', error);
      throw new Error('無法載入機構審核名單。');
    }

    return ((data ?? []) as AgencyReviewRow[]).map((row) => this.map(row));
  }

  async updateStatus(id: string, status: Exclude<ReviewStatus, 'pending'>, reviewNote: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('agency_profiles')
      .update({
        verificationStatus: status,
        reviewNote,
        updatedAt: new Date().toISOString(),
      })
      .eq('uid', id);

    if (error) {
      console.error('更新機構審核失敗：', error);
      return false;
    }

    return true;
  }

  async cancelAccount(id: string, reviewNote: string): Promise<boolean> {
    const deletedAt = new Date().toISOString();
    const { error } = await this.supabase.client
      .from('agency_profiles')
      .update({
        accountStatus: 'DELETED',
        deletedAt,
        reviewNote,
        updatedAt: deletedAt,
      })
      .eq('uid', id);

    if (error) {
      console.error('註銷機構帳號失敗：', error);
      return false;
    }

    return true;
  }

  async storeFile(uid: string, file: File): Promise<string> {
    const contentType = fileContentType(file);
    if (file.size <= 0 || file.size > FILE_LIMIT) {
      throw new Error('證明文件需小於 8MB。');
    }

    const body = await fileToBase64(file);
    let lastMessage = '證明文件上傳失敗。';

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await this.supabase.client.rpc('save_agency_verification_file', {
        p_uid: uid,
        p_name: file.name,
        p_type: contentType,
        p_base64: body,
      });

      if (!error && typeof data === 'string' && data.startsWith('stored:')) {
        return data;
      }

      lastMessage = error?.message || lastMessage;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    throw new Error(lastMessage);
  }

  async readFile(uid: string): Promise<AgencyVerificationFile> {
    const { data, error } = await this.supabase.client.rpc('read_agency_verification_file', { p_uid: uid });

    if (error) {
      throw new Error(error.message || '無法開啟證明文件。');
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { file_name: string; content_type: string; body_base64: string }
      | null;

    if (!row?.body_base64) {
      throw new Error('這筆申請沒有可開啟的證明文件。');
    }

    return {
      fileName: row.file_name,
      contentType: row.content_type,
      bodyBase64: row.body_base64,
    };
  }

  private map(row: AgencyReviewRow): AgencyApplication {
    const document = row.verificationDocumentUrl?.trim() || '';
    return {
      id: row.uid,
      name: row.agencyName?.trim() || '未命名機構',
      email: row.email?.trim() || '',
      registrationNumber: row.registrationNumber?.trim() || '未填',
      representative: row.representative?.trim() || '未填',
      phone: row.contactPhone?.trim() || '未填',
      defaultAddress: row.defaultAddress?.trim() || '未填',
      contact: row.contactPersonName?.trim() || '未填',
      contactPersonTitle: row.contactPersonTitle?.trim() || '未填',
      department: row.department?.trim() || '未填',
      contactPersonPhone: row.contactPersonPhone?.trim() || '未填',
      contactPersonEmail: row.contactPersonEmail?.trim() || '未填',
      consentToContact: row.consentToContact ?? false,
      agreeToTerms: row.agreeToTerms ?? false,
      submittedAt: row.createdAt ? row.createdAt.slice(0, 10) : '',
      documentName: document.replace(/^stored:/, '') || '尚未選擇檔案',
      documentStored: document.startsWith('stored:'),
      status: isReviewStatus(row.verificationStatus) ? row.verificationStatus : 'pending',
      accountStatus: row.accountStatus === 'DELETED' ? 'DELETED' : 'ACTIVE',
      reviewNote: row.reviewNote ?? '',
    };
  }
}

function isReviewStatus(value: string | null): value is ReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'supplement';
}

function fileContentType(file: File): string {
  if (FILE_TYPES.includes(file.type)) {
    return file.type;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  throw new Error('證明文件請用 PDF、JPG、PNG 或 WEBP。');
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('無法讀取證明文件。'));
    reader.readAsDataURL(file);
  });
}
