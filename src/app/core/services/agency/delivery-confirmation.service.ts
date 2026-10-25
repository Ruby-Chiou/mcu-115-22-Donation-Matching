import { Injectable, inject } from '@angular/core';

import { DeliveryShipment, ReceiptProofFile } from '../../../models/agency/delivery-confirmation';
import { SupabaseService } from '../database/supabase.service';

interface ShipmentRow {
  id: string;
  donor_uid: string | null;
  donor_name: string | null;
  phone: string | null;
  actual_material: string | null;
  quantity: number | null;
  donation_method: string | null;
  tracking_no: string | null;
  tracking_uploaded_at: string | null;
  note: string | null;
  receipt_confirmed_at: string | null;
  receipt_partial: boolean | null;
  receipt_declined_video: boolean | null;
  receipt_note: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryConfirmationService {
  private readonly supabase = inject(SupabaseService);
  private readonly bucket = 'donation-files';

  async list(): Promise<DeliveryShipment[]> {
    const { data, error } = await this.supabase.client
      .from('donor_daily_donations')
      .select(
        'id, donor_uid, donor_name, phone, actual_material, quantity, donation_method, tracking_no, tracking_uploaded_at, note, receipt_confirmed_at, receipt_partial, receipt_declined_video, receipt_note',
      )
      .eq('status', 'human_approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('無法載入待簽收的捐助。');
    }

    return ((data ?? []) as ShipmentRow[]).map((row) => ({
      id: row.id,
      donorUid: row.donor_uid?.trim() || '',
      donorName: row.donor_name?.trim() || '未填姓名',
      phone: row.phone?.trim() || '',
      actualMaterial: row.actual_material?.trim() || '未填物資',
      quantity: row.quantity ?? 0,
      donationMethod: row.donation_method?.trim() || '',
      trackingNo: row.tracking_no?.trim() || '',
      trackingUploadedAt: row.tracking_uploaded_at,
      note: row.note?.trim() || '',
      receiptConfirmedAt: row.receipt_confirmed_at,
      receiptPartial: !!row.receipt_partial,
      receiptDeclinedVideo: !!row.receipt_declined_video,
      receiptNote: row.receipt_note?.trim() || '',
    }));
  }

  waitingCount(shipments: DeliveryShipment[]): number {
    return shipments.filter((shipment) => !shipment.receiptConfirmedAt && this.readyToConfirm(shipment)).length;
  }

  readyToConfirm(shipment: DeliveryShipment): boolean {
    if (shipment.receiptConfirmedAt) {
      return false;
    }

    return shipment.donationMethod !== '寄送' || shipment.trackingNo.length > 0;
  }

  async proofs(donationId: string): Promise<ReceiptProofFile[]> {
    const { data, error } = await this.supabase.client
      .from('donation_files')
      .select('id, file_type, storage_path, original_filename, mime_type')
      .eq('donation_id', donationId)
      .in('file_type', ['receipt_image', 'receipt_video'])
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('無法讀取簽收照片。');
    }

    const files = data ?? [];
    return Promise.all(
      files.map(async (file) => {
        const { data: signed, error: signedError } = await this.supabase.client.storage
          .from(this.bucket)
          .createSignedUrl(file.storage_path, 3600);

        if (signedError) {
          throw new Error('無法開啟簽收檔案。');
        }

        return {
          id: file.id,
          fileType: file.file_type,
          name: file.original_filename,
          url: signed.signedUrl,
          mimeType: file.mime_type,
        } as ReceiptProofFile;
      }),
    );
  }

  async submit(input: {
    donationId: string;
    photos: File[];
    video: File | null;
    partial: boolean;
    declinedVideo: boolean;
    note: string;
  }): Promise<void> {
    for (let index = 0; index < input.photos.length; index += 1) {
      await this.store(input.donationId, input.photos[index], 'receipt_image', index);
    }

    if (input.video) {
      await this.store(input.donationId, input.video, 'receipt_video', 0);
    }

    const { error } = await this.supabase.client.rpc('confirm_donation_receipt', {
      p_donation_id: input.donationId,
      p_partial: input.partial,
      p_declined_video: input.declinedVideo && !input.video,
      p_note: input.note,
    });

    if (error) {
      throw new Error(error.message || '簽收回報失敗。');
    }
  }

  private async store(
    donationId: string,
    file: File,
    fileType: 'receipt_image' | 'receipt_video',
    index: number,
  ): Promise<void> {
    const folder = fileType === 'receipt_image' ? 'receipt-images' : 'receipt-videos';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const storagePath = `donations/${donationId}/${folder}/${index}-${safeName}`;

    const { error: uploadError } = await this.supabase.client.storage.from(this.bucket).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message || '檔案上傳失敗。');
    }

    const { error: recordError } = await this.supabase.client.from('donation_files').insert({
      donation_id: donationId,
      file_type: fileType,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
    });

    if (recordError) {
      throw new Error(recordError.message || '簽收檔案沒有寫入。');
    }
  }
}
