import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from '../member-center/member-session.service';
import { DonorAccountRecord } from './donor-account-admin.service';

export type DonorActivityKind = 'donation' | 'thank' | 'receipt' | 'certificate' | 'message';

export interface DonorActivityItem {
  kind: DonorActivityKind;
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  fields: Record<string, string>;
}

export interface DonorActivity {
  items: DonorActivityItem[];
}

const DONATION_STATUS: Record<string, string> = {
  pending_ai_review: '等待系統審核',
  pending_human_review: '等待機構審核',
  human_approved: '審核通過',
  human_rejected: '未通過',
};

@Injectable({
  providedIn: 'root',
})
export class DonorActivityService {
  private readonly supabase = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  async sendMessage(donor: DonorAccountRecord, subject: string, content: string): Promise<void> {
    const authorUid = await this.session.getCurrentUid();
    const { error } = await this.supabase.client.from('member_messages').insert({
      recipientUid: donor.uid,
      recipientName: donor.displayName || donor.email || '捐助者',
      senderUid: authorUid,
      senderName: '平台管理者',
      category: 'SYSTEM',
      subject: subject.trim(),
      content: content.trim(),
    });

    if (error) {
      throw error;
    }
  }

  async repairDonation(id: string, fields: Record<string, string>): Promise<void> {
    const quantity = Number(fields['quantity']);
    const { error } = await this.supabase.client
      .from('donor_daily_donations')
      .update({
        actual_material: fields['material'].trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        status: fields['status'],
        tracking_no: fields['tracking'].trim() || null,
        note: fields['note'].trim(),
        thank_name_mode: fields['nameMode'] === 'full' ? 'full' : 'masked',
        thank_public: fields['isPublic'] !== 'false',
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    const { error: thankError } = await this.supabase.client.rpc('set_donation_visibility', {
      p_donation_id: id,
      p_name_mode: fields['nameMode'] === 'full' ? 'full' : 'masked',
      p_public: fields['isPublic'] !== 'false',
    });

    if (thankError) {
      throw thankError;
    }
  }

  async repairThank(id: string, fields: Record<string, string>): Promise<void> {
    const { error } = await this.supabase.client
      .from('public_donation_thanks')
      .update({
        displayName: fields['displayName'].trim(),
        donationItem: fields['donationItem'].trim(),
        agencyName: fields['agencyName'].trim() || '平台',
        nameMode: fields['nameMode'] === 'full' ? 'full' : 'masked',
        isPublic: fields['isPublic'] !== 'false',
      })
      .eq('id', Number(id));

    if (error) {
      throw error;
    }
  }

  async repairReceipt(id: string, fields: Record<string, string>): Promise<void> {
    const { error } = await this.supabase.client
      .from('donor_receipts')
      .update({
        receiptNo: fields['receiptNo'].trim(),
        agencyName: fields['agencyName'].trim(),
        donationItem: fields['donationItem'].trim(),
      })
      .eq('id', Number(id));

    if (error) {
      throw error;
    }
  }

  async repairCertificate(id: string, fields: Record<string, string>): Promise<void> {
    const { error } = await this.supabase.client
      .from('agency_uploaded_certificates')
      .update({
        agencyName: fields['agencyName'].trim(),
        donationItem: fields['donationItem'].trim(),
        note: fields['note'].trim(),
      })
      .eq('id', Number(id));

    if (error) {
      throw error;
    }
  }

  async activity(donorUid: string): Promise<DonorActivity> {
    const [donations, thanks, receipts, certificates, inbox, sent] = await Promise.all([
      this.rows('donor_daily_donations', 'donor_uid', donorUid, 'created_at'),
      this.rows('public_donation_thanks', 'donorUid', donorUid, 'publishedAt'),
      this.rows('donor_receipts', 'donorUid', donorUid, 'issuedAt'),
      this.rows('agency_uploaded_certificates', 'donorUid', donorUid, 'uploadedAt'),
      this.rows('member_messages', 'recipientUid', donorUid, 'createdAt'),
      this.rows('member_messages', 'senderUid', donorUid, 'createdAt'),
    ]);

    const items: DonorActivityItem[] = [
      ...donations.map((row) => this.donationItem(row)),
      ...thanks.map((row) => this.thankItem(row)),
      ...receipts.map((row) => this.receiptItem(row)),
      ...certificates.map((row) => this.certificateItem(row)),
      ...this.messageItems(inbox, sent),
    ];

    return {
      items: items.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    };
  }

  private donationItem(row: Record<string, unknown>): DonorActivityItem {
    const status = String(row['status'] ?? '');
    return {
      kind: 'donation',
      id: String(row['id']),
      title: String(row['actual_material'] || '捐助物資'),
      detail: `${row['quantity'] ?? ''} 件 · ${DONATION_STATUS[status] ?? '處理中'}`,
      createdAt: String(row['created_at'] ?? ''),
      fields: {
        material: String(row['actual_material'] ?? ''),
        quantity: String(row['quantity'] ?? ''),
        status,
        tracking: String(row['tracking_no'] ?? ''),
        nameMode: row['thank_name_mode'] === 'full' ? 'full' : 'masked',
        isPublic: row['thank_public'] === false ? 'false' : 'true',
        note: String(row['note'] ?? ''),
        method: String(row['donation_method'] ?? ''),
        aiReason: String(row['ai_reason'] ?? ''),
        humanReason: String(row['human_reason'] ?? ''),
      },
    };
  }

  private thankItem(row: Record<string, unknown>): DonorActivityItem {
    return {
      kind: 'thank',
      id: String(row['id']),
      title: String(row['donationItem'] || '公開感謝'),
      detail: `${row['displayName'] || '捐助者'} · ${row['isPublic'] === false ? '未公開' : '公開中'}`,
      createdAt: String(row['publishedAt'] ?? ''),
      fields: {
        displayName: String(row['displayName'] ?? ''),
        donationItem: String(row['donationItem'] ?? ''),
        agencyName: String(row['agencyName'] ?? ''),
        nameMode: row['nameMode'] === 'full' ? 'full' : 'masked',
        isPublic: row['isPublic'] === false ? 'false' : 'true',
        donationId: String(row['donationId'] ?? ''),
      },
    };
  }

  private receiptItem(row: Record<string, unknown>): DonorActivityItem {
    return {
      kind: 'receipt',
      id: String(row['id']),
      title: String(row['receiptNo'] || '收據'),
      detail: `${row['agencyName'] || '機構'} · ${row['donationItem'] || ''}`,
      createdAt: String(row['issuedAt'] ?? ''),
      fields: {
        receiptNo: String(row['receiptNo'] ?? ''),
        agencyName: String(row['agencyName'] ?? ''),
        donationItem: String(row['donationItem'] ?? ''),
        pdfUrl: String(row['pdfUrl'] ?? ''),
      },
    };
  }

  private certificateItem(row: Record<string, unknown>): DonorActivityItem {
    return {
      kind: 'certificate',
      id: String(row['id']),
      title: String(row['agencyName'] || '感謝狀'),
      detail: String(row['donationItem'] || row['fileName'] || ''),
      createdAt: String(row['uploadedAt'] ?? ''),
      fields: {
        agencyName: String(row['agencyName'] ?? ''),
        donationItem: String(row['donationItem'] ?? ''),
        note: String(row['note'] ?? ''),
        fileUrl: String(row['fileUrl'] ?? ''),
      },
    };
  }

  private messageItems(inbox: Record<string, unknown>[], sent: Record<string, unknown>[]): DonorActivityItem[] {
    const messages = new Map<string, DonorActivityItem>();

    for (const row of inbox) {
      const item = this.messageLine(row, '收件');
      messages.set(item.id, item);
    }

    for (const row of sent) {
      const item = this.messageLine(row, '寄件');
      if (!messages.has(item.id)) {
        messages.set(item.id, item);
      }
    }

    return [...messages.values()];
  }

  private messageLine(row: Record<string, unknown>, folder: '收件' | '寄件'): DonorActivityItem {
    const peer = folder === '收件' ? row['senderName'] : row['recipientName'];
    return {
      kind: 'message',
      id: String(row['id']),
      title: String(row['subject'] || '站內信'),
      detail: `${folder} · ${peer || '平台'}`,
      createdAt: String(row['createdAt'] ?? ''),
      fields: {
        subject: String(row['subject'] ?? ''),
        content: String(row['content'] ?? ''),
        folder,
        peer: String(peer ?? ''),
      },
    };
  }

  private async rows(table: string, column: string, donorUid: string, orderColumn: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase.client.from(table).select('*').eq(column, donorUid).order(orderColumn, { ascending: false });

    if (error) {
      console.error(`讀取 ${table} 失敗：`, error);
      return [];
    }

    return (data ?? []) as Record<string, unknown>[];
  }
}
