import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../../environment/environment';

type DonationFileType = 'material_image' | 'material_video';

interface DonationFileUpload {
  file: File;
  fileType: DonationFileType;
}

@Injectable({
  providedIn: 'root',
})
export class DonationService {
  private readonly tableName = 'donor_daily_donations';

  private readonly fileTableName = 'donation_files';

  private readonly bucketName = 'donation-files';

  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabasePublishableKey);

  async createDonation(data: {
    demandId: number;
    donorName: string;
    phone: string;
    actualMaterial: string;
    quantity: number;
    donationMethod: '寄送' | '面交';
    note: string;
    needReceipt: boolean;
    needThankYou: boolean;
    receiptTitle: string | null;
    taxId: string | null;
    materialFiles: File[];
    materialVideoFiles: File[];
  }) {
    const { data: donation, error: donationError } = await this.supabase
      .from(this.tableName)
      .insert({
        demand_id: data.demandId,
        donor_name: data.donorName,
        phone: data.phone,
        actual_material: data.actualMaterial,
        quantity: data.quantity,
        donation_method: data.donationMethod,
        note: data.note,
        need_receipt: data.needReceipt,
        need_thank_you: data.needThankYou,
        receipt_title: data.receiptTitle,
        tax_id: data.taxId,
        status: 'pending_ai_review',
      })
      .select()
      .single();

    if (donationError) {
      throw donationError;
    }

    if (!donation) {
      throw new Error('建立捐助資料後沒有取得資料');
    }

    const files: DonationFileUpload[] = [
      ...data.materialFiles.map((file): DonationFileUpload => ({
        file,
        fileType: 'material_image',
      })),

      ...data.materialVideoFiles.map((file): DonationFileUpload => ({
        file,
        fileType: 'material_video',
      })),
    ];

    for (let index = 0; index < files.length; index++) {
      const currentFile = files[index];

      await this.uploadDonationFile(donation.id, currentFile.file, currentFile.fileType, index);
    }

    return donation;
  }

  private async uploadDonationFile(donationId: string, file: File, fileType: DonationFileType, index: number): Promise<void> {
    const safeFileName = this.createSafeFileName(file.name);

    const folder = fileType === 'material_image' ? 'images' : 'videos';

    const storagePath = `donations/${donationId}/` + `${folder}/${index}-${safeFileName}`;

    const { error: uploadError } = await this.supabase.storage.from(this.bucketName).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { error: fileRecordError } = await this.supabase.from(this.fileTableName).insert({
      donation_id: donationId,
      file_type: fileType,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
    });

    if (fileRecordError) {
      throw fileRecordError;
    }
  }

  private createSafeFileName(fileName: string): string {
    const extension = fileName.includes('.') ? (fileName.split('.').pop()?.toLowerCase() ?? '') : '';

    const baseName = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();

    return extension ? `${baseName}.${extension}` : baseName;
  }
}
