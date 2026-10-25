import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';

const CERTIFICATE_ACCEPT = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const CERTIFICATE_MAX_BYTES = 8 * 1024 * 1024;

export interface CertificateUpload {
  donationId: string;
  donorUid: string;
  needThankYou: boolean;
  alreadyUploaded: boolean;
  agencyName: string;
  donationItem: string;
  donationDate: string;
  file: File;
  note: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgencyCertificateUploadService {
  private readonly certificateTable = 'agency_uploaded_certificates';
  private readonly certificateBucket = 'agency-certificates';
  private readonly supabase = inject(SupabaseService);

  async upload(input: CertificateUpload): Promise<void> {
    if (!input.needThankYou) {
      throw new Error('此筆捐助未申請感謝狀');
    }

    if (!input.donorUid) {
      throw new Error('缺少捐助者會員編號，無法上傳感謝狀');
    }

    const agencyName = input.agencyName.trim();
    if (!agencyName) {
      throw new Error('請填寫受贈機構名稱');
    }

    if (!CERTIFICATE_ACCEPT.includes(input.file.type)) {
      throw new Error('僅支援 PDF、JPG、PNG、WEBP');
    }

    if (input.file.size > CERTIFICATE_MAX_BYTES) {
      throw new Error('檔案大小不可超過 8MB');
    }

    const extension = input.file.name.includes('.') ? (input.file.name.split('.').pop()?.toLowerCase() ?? 'bin') : 'bin';
    const storagePath = `${input.donorUid}/${input.donationId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await this.supabase.client.storage
      .from(this.certificateBucket)
      .upload(storagePath, input.file, { contentType: input.file.type, upsert: false });

    if (uploadError) {
      console.error('上傳感謝狀失敗：', uploadError);
      throw uploadError;
    }

    const { data: urlData } = this.supabase.client.storage.from(this.certificateBucket).getPublicUrl(storagePath);

    if (input.alreadyUploaded) {
      const { error: deleteError } = await this.supabase.client.from(this.certificateTable).delete().eq('donationId', input.donationId);
      if (deleteError) {
        console.error('清除舊感謝狀紀錄失敗：', deleteError);
        throw deleteError;
      }
    }

    const { error } = await this.supabase.client.from(this.certificateTable).insert({
      donationId: input.donationId,
      donorUid: input.donorUid,
      agencyName,
      donationItem: input.donationItem,
      donationDate: input.donationDate,
      fileUrl: urlData.publicUrl,
      fileName: input.file.name,
      mimeType: input.file.type,
      note: input.note.trim(),
      uploadedAt: new Date().toISOString(),
    });

    if (error) {
      console.error('寫入感謝狀紀錄失敗：', error);
      throw error;
    }
  }
}
