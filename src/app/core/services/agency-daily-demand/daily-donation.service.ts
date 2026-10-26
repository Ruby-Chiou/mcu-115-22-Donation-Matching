import { Injectable, inject } from '@angular/core';

import { environment } from '../../../../environment/environment';

import { DonationFile, RecipientDonationReview } from '../../../models/agency/item-review';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from '../member-center/member-session.service';
import { PublicDonationThankService } from '../member-center/public-donation-thank.service';
import { MemberMailDispatchService } from '../member-center/member-mail-dispatch.service';

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

  private readonly supabaseService = inject(SupabaseService);

  private get supabase() {
    return this.supabaseService.client;
  }

  private readonly memberSession = inject(MemberSessionService);
  private readonly publicThanks = inject(PublicDonationThankService);
  private readonly mail = inject(MemberMailDispatchService);

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
    thankNameMode: 'masked' | 'full';
    thankPublic: boolean;
    receiptTitle: string | null;
    taxId: string | null;
    donorEmail: string | null;
    donorIdNo: string | null;
    receiptLines: { name: string; quantity: number; unit: string; estimatedPrice: number | null }[] | null;
    materialFiles: File[];
    materialVideoFiles: File[];
  }) {
    const donorUid = await this.resolveDonorUid();

    const { data: donation, error: donationError } = await this.supabase
      .from(this.tableName)
      .insert({
        demand_id: data.demandId,
        donor_uid: donorUid,
        donor_name: data.donorName,
        phone: data.phone,
        actual_material: data.actualMaterial,
        quantity: data.quantity,
        donation_method: data.donationMethod,
        note: data.note,
        need_receipt: data.needReceipt,
        need_thank_you: data.needThankYou,
        thank_name_mode: data.thankNameMode,
        thank_public: data.thankPublic,
        receipt_title: data.receiptTitle,
        tax_id: data.taxId,
        donor_email: data.donorEmail,
        donor_id_no: data.donorIdNo,
        receipt_lines: data.receiptLines,
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

    try {
      for (let index = 0; index < files.length; index += 1) {
        const currentFile = files[index];

        await this.uploadDonationFile(donation.id, currentFile.file, currentFile.fileType, index);
      }
    } catch (error) {
      await this.supabase.from(this.tableName).delete().eq('id', donation.id);
      throw error;
    }

    return donation;
  }

  async reviewDonationWithAi(donationId: string): Promise<AiReviewResult> {
    const response = await fetch(this.aiReviewUrl(donationId), { method: 'POST' });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      donationId?: string;
      DonationId?: string;
      status?: string;
      Status?: string;
      aiDecision?: string;
      AiDecision?: string;
      decisionText?: string;
      DecisionText?: string;
      detectedCondition?: string;
      DetectedCondition?: string;
      reason?: string;
      Reason?: string;
      conditionMatches?: boolean;
      ConditionMatches?: boolean;
    } | null;

    const reason = (payload?.reason ?? payload?.Reason ?? '').trim();
    const decision = payload?.aiDecision ?? payload?.AiDecision ?? '';

    if (!response.ok || (decision !== 'accepted' && decision !== 'rejected') || reason.length < 8) {
      throw new Error(payload?.message || '這次沒有辨識完成，機構會直接看照片確認。');
    }

    return {
      donationId: payload?.donationId ?? payload?.DonationId ?? donationId,
      status: payload?.status ?? payload?.Status ?? 'pending_human_review',
      decision,
      decisionText: payload?.decisionText ?? payload?.DecisionText ?? '',
      detectedCondition: payload?.detectedCondition ?? payload?.DetectedCondition ?? '',
      reason,
      conditionMatches: Boolean(payload?.conditionMatches ?? payload?.ConditionMatches),
    };
  }

  /** 本機開發走 proxy，避免 127.0.0.1 被後端 CORS 擋住。正式站直接打 Render。 */
  private aiReviewUrl(donationId: string): string {
    const path = `/api/ai-donation-reviews/donations/${encodeURIComponent(donationId)}/ai-review`;
    const host = typeof location === 'undefined' ? '' : location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return path;
    }

    return `${environment.aiReviewApiUrl}${path}`;
  }

  private toAiReviewResult(donationId: string, data: unknown): AiReviewResult {
    const result = data as {
      donationId?: string;
      status?: string;
      decision?: string;
      decisionText?: string;
      detectedCondition?: string;
      reason?: string;
      conditionMatches?: boolean;
    };

    return {
      donationId: result.donationId || donationId,
      status: result.status || 'pending_human_review',
      decision: result.decision || '',
      decisionText: result.decisionText || '',
      detectedCondition: result.detectedCondition || '',
      reason: result.reason || '',
      conditionMatches: !!result.conditionMatches,
    };
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

  /** 登入會員或開發用 demo uid；訪客捐助則不寫入身分。 */
  private async resolveDonorUid(): Promise<string | null> {
    try {
      return await this.memberSession.getCurrentUid();
    } catch {
      return null;
    }
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
        donor_uid,
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

    const { error: noticeError } = await this.supabase.rpc('notify_donation_review', {
      p_donation_id: donationId,
    });

    if (noticeError) {
      console.error('審核通知沒有送進收件匣：', noticeError);
    } else {
      void this.mail.sweep();
    }

    if (!isAccepted) {
      return;
    }

    try {
      await this.publicThanks.publishApprovedDonation(donationId);
    } catch (publishError) {
      console.error('公開到感謝牆失敗：', publishError);
    }
  }
}
