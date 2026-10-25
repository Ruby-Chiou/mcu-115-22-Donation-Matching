import { Injectable, inject } from '@angular/core';

import { CompanyReviewStatus } from '../../../models/auth/app-role';
import { SupabaseService } from '../database/supabase.service';

export interface CompanyApplication {
  userId: string;
  companyName: string;
  taxId: string;
  representative: string;
  contactPhone: string;
  address: string;
  documentName: string;
  status: CompanyReviewStatus;
  reviewNote: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyVerificationService {
  private readonly supabase = inject(SupabaseService);

  async list(): Promise<CompanyApplication[]> {
    const { data, error } = await this.supabase.client
      .from('donor_company_applications')
      .select('user_id, company_name, tax_id, representative, contact_phone, address, document_name, status, review_note, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('無法載入企業審核名單。');
    }

    return (data ?? []).map((row) => this.map(row as Record<string, string>));
  }

  async review(userId: string, status: Exclude<CompanyReviewStatus, 'pending'>, note: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('donor_company_applications')
      .update({
        status,
        review_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error('無法更新審核結果。');
    }
  }

  private map(row: Record<string, string>): CompanyApplication {
    const status = row['status'];
    return {
      userId: row['user_id'],
      companyName: row['company_name'],
      taxId: row['tax_id'],
      representative: row['representative'],
      contactPhone: row['contact_phone'] ?? '',
      address: row['address'] ?? '',
      documentName: row['document_name'] ?? '',
      status: isStatus(status) ? status : 'pending',
      reviewNote: row['review_note'] ?? '',
      createdAt: row['created_at'],
    };
  }
}

function isStatus(value: string): value is CompanyReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'supplement';
}
