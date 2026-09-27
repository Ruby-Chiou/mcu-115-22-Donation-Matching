import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environment/environment';

import { DonationFile, RecipientDonationReview } from '../../../models/agency/item-review';

type DonationFileType = 'material_image' | 'material_video';

type HumanDecision = 'accepted' | 'rejected';

interface DonationFileUpload {
  file: File;
  fileType: DonationFileType;
}

export interface AiReviewResult {
  donationId: string;
  status: string;
  decision: string;
  decisionText: string;
  detectedCondition: string;
  reason: string;
  conditionMatches: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DonationService {
  private readonly tableName = 'donor_daily_donations';

  private readonly supplyItemTableName = 'agency_daily_supply_items';

  private readonly fileTableName = 'donation_files';

  private readonly bucketName = 'donation-files';

  private readonly apiUrl = 'http://127.0.0.1:8000';

  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabasePublishableKey);

  constructor(private readonly http: HttpClient) {}

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

    for (let index = 0; index < files.length; index += 1) {
      const currentFile = files[index];

      await this.uploadDonationFile(donation.id, currentFile.file, currentFile.fileType, index);
    }

    return donation;
  }

  async reviewDonationWithAi(donationId: string): Promise<AiReviewResult> {
    return await firstValueFrom(this.http.post<AiReviewResult>(`${this.apiUrl}/donations/${donationId}/ai-review`, {}));
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

  /**
   * 取得受助者需求物資名稱。
   */
  async getDemandItem(demandId: number): Promise<string> {
    const { data, error } = await this.supabase.from(this.supplyItemTableName).select('item').eq('id', demandId).single();

    if (error) {
      throw error;
    }

    return data?.item ?? '';
  }

  /**
   * 取得審核列表需要顯示與篩選的需求欄位。
   */
  private async getDemandReviewMetadata(demandId: number): Promise<{ item: string; category: string; priority: string }> {
    const { data, error } = await this.supabase
      .from(this.supplyItemTableName)
      .select('item, category, priority')
      .eq('id', demandId)
      .single();

    if (error) {
      throw error;
    }

    return {
      item: data?.item ?? '',
      category: data?.category ?? '',
      priority: data?.priority ?? '',
    };
  }

  /**
   * 取得受助者需求條件。
   */
  async getDemandConditions(demandId: number): Promise<string[]> {
    const { data, error } = await this.supabase.from(this.supplyItemTableName).select('conditions').eq('id', demandId).single();

    if (error) {
      throw error;
    }

    return data?.conditions ?? [];
  }

  /**
   * 取得審核列表。
   *
   * demand_material 是受助者原本需要的物資。
   * actual_material 是捐助者實際填寫的物資。
   */
  async getRecipientDonationReviews(): Promise<RecipientDonationReview[]> {
    const { data: donations, error: donationError } = await this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        demand_id,
        donor_name,
        actual_material,
        quantity,
        note,
        donation_method,
        status,
        ai_decision,
        ai_condition,
        ai_reason,
        ai_checked_at,
        human_decision,
        human_reason,
        human_checked_at,
        created_at
      `
      )
      .order('created_at', {
        ascending: false,
      });

    if (donationError) {
      throw donationError;
    }

    const donationList = donations ?? [];

    return Promise.all(
      donationList.map(async (donation) => {
        const demandMetadata = await this.getDemandReviewMetadata(donation.demand_id);

        return {
          ...donation,
          demand_material: demandMetadata.item,
          demand_category: demandMetadata.category,
          demand_priority: demandMetadata.priority,
        } as RecipientDonationReview;
      })
    );
  }

  /**
   * 取得單筆物資審核詳細資料。
   */
  async getRecipientDonationReviewById(donationId: string): Promise<RecipientDonationReview> {
    const { data: donation, error: donationError } = await this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        demand_id,
        donor_name,
        phone,
        actual_material,
        quantity,
        note,
        donation_method,
        status,
        ai_decision,
        ai_condition,
        ai_reason,
        ai_checked_at,
        human_decision,
        human_reason,
        human_checked_at,
        created_at
      `
      )
      .eq('id', donationId)
      .single();

    if (donationError) {
      throw donationError;
    }

    if (!donation) {
      throw new Error('找不到物資審核資料');
    }

    const demandMaterial = await this.getDemandItem(donation.demand_id);

    return {
      ...donation,
      demand_material: demandMaterial,
    } as RecipientDonationReview;
  }

  /**
   * 取得需求物資的圖片和影片。
   */
  async getDonationFiles(donationId: string): Promise<DonationFile[]> {
    const { data, error } = await this.supabase
      .from(this.fileTableName)
      .select(
        `
        id,
        donation_id,
        file_type,
        storage_path,
        original_filename,
        mime_type,
        file_size,
        created_at
      `
      )
      .eq('donation_id', donationId)
      .in('file_type', ['material_image', 'material_video'])
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return Promise.all(
      (data ?? []).map(async (file) => {
        const { data: signedData, error: signedError } = await this.supabase.storage
          .from(this.bucketName)
          .createSignedUrl(file.storage_path, 3600);

        if (signedError) {
          throw signedError;
        }

        return {
          ...file,
          public_url: signedData.signedUrl,
        } as DonationFile;
      })
    );
  }

  /**
   * 寫入人工審核結果。
   */
  async updateHumanReviewDecision(donationId: string, humanDecision: HumanDecision, humanReason: string | null): Promise<void> {
    const isAccepted = humanDecision === 'accepted';

    const updateData = {
      status: isAccepted ? 'human_approved' : 'human_rejected',

      human_decision: humanDecision,

      human_reason: isAccepted ? null : humanReason,

      human_checked_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.from(this.tableName).update(updateData).eq('id', donationId).eq('status', 'pending_human_review');

    if (error) {
      console.error('更新人工審核結果失敗：', error);

      throw error;
    }
  }
}
