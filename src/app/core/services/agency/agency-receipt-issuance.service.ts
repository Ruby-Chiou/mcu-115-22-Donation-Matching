import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../../environment/environment';
import { AgencyReceiptTask, IssuedDonationReceipt, ReceiptDraft, ReceiptSealFiles } from '../../../models/agency/receipt-issuance';
import { SupabaseService } from '../database/supabase.service';
import { PublicDonationThankService } from '../member-center/public-donation-thank.service';

interface DonationRow {
  id: string;
  donor_uid: string | null;
  donor_name: string | null;
  phone: string | null;
  demand_id: number;
  actual_material: string | null;
  quantity: number | null;
  donation_method: string | null;
  receipt_title: string | null;
  tax_id: string | null;
  need_receipt: boolean | null;
  need_thank_you: boolean | null;
  status: string;
  created_at: string;
}

interface DemandRow {
  id: number;
  item: string | null;
}

interface ReceiptRow {
  id: number;
  donationId: string | null;
  receiptNo: string;
  donorName: string | null;
  receiptTitle: string | null;
  agencyName: string | null;
  agencyNameEn: string | null;
  orgTaxId: string | null;
  approvalNo: string | null;
  donorIdNo: string | null;
  donorAddress: string | null;
  donorPhone: string | null;
  donationItem: string | null;
  donationDate: string | null;
  note: string | null;
  accountName: string | null;
  postalAccount: string | null;
  orgPhone: string | null;
  orgFax: string | null;
  orgEmail: string | null;
  orgAddress: string | null;
  handlerName: string | null;
  issuedAt: string | null;
  largeSealUrl: string | null;
  smallSealUrl: string | null;
}

interface CertificateRow {
  donationId: string | null;
  fileName: string | null;
}

const CERTIFICATE_ACCEPT = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const CERTIFICATE_MAX_BYTES = 8 * 1024 * 1024;
const SEAL_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const SEAL_MAX_BYTES = 2 * 1024 * 1024;

@Injectable({
  providedIn: 'root',
})
export class AgencyReceiptIssuanceService {
  private readonly donationTable = 'donor_daily_donations';
  private readonly demandTable = 'agency_daily_supply_items';
  private readonly receiptTable = 'donor_receipts';
  private readonly certificateTable = 'agency_uploaded_certificates';
  private readonly certificateBucket = 'agency-certificates';

  private readonly supabaseService = inject(SupabaseService);
  private readonly publicThanks = inject(PublicDonationThankService);

  private readonly tasksSignal = signal<AgencyReceiptTask[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  readonly certificateAccept = CERTIFICATE_ACCEPT.join(',');
  readonly defaultAgencyName = '示範社福機構';

  async loadTasks(): Promise<AgencyReceiptTask[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.donationTable)
      .select(
        `
        id,
        donor_uid,
        donor_name,
        phone,
        demand_id,
        actual_material,
        quantity,
        donation_method,
        receipt_title,
        tax_id,
        need_receipt,
        need_thank_you,
        status,
        created_at
      `
      )
      .eq('status', 'human_approved')
      .or('need_receipt.eq.true,need_thank_you.eq.true')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取待核發捐助失敗：', error);
      throw error;
    }

    const rows = (data ?? []) as DonationRow[];
    const donationIds = rows.map((row) => row.id);
    const [demandMap, receiptMap, certificateMap] = await Promise.all([
      this.loadDemandMap(rows.map((row) => row.demand_id)),
      this.loadReceiptMap(donationIds),
      this.loadCertificateMap(donationIds),
    ]);

    const tasks = rows.map((row) => {
      const receipt = receiptMap.get(row.id);
      const certificate = certificateMap.get(row.id);

      return {
        donationId: row.id,
        donorUid: row.donor_uid ?? environment.memberDemoUid ?? '',
        donorName: row.donor_name ?? '',
        phone: row.phone ?? '',
        demandId: row.demand_id,
        demandItem: demandMap.get(row.demand_id) ?? '（需求已移除）',
        actualMaterial: row.actual_material ?? '',
        quantity: row.quantity ?? 0,
        donationMethod: row.donation_method ?? '',
        receiptTitle: row.receipt_title || row.donor_name || '',
        taxId: row.tax_id ?? '',
        needReceipt: !!row.need_receipt,
        needThankYou: !!row.need_thank_you,
        receiptIssued: !!receipt,
        certificateUploaded: !!certificate,
        receiptNo: receipt?.receiptNo ?? null,
        receipt: receipt ? this.mapReceipt(receipt) : null,
        certificateFileName: certificate?.fileName ?? null,
        createdAt: row.created_at,
        donationDate: row.created_at.slice(0, 10),
      } satisfies AgencyReceiptTask;
    });

    this.tasksSignal.set(tasks);
    return tasks;
  }

  async getTask(donationId: string): Promise<AgencyReceiptTask | null> {
    const tasks = await this.loadTasks();

    return tasks.find((task) => task.donationId === donationId) ?? null;
  }

  draftFromTask(task: AgencyReceiptTask): ReceiptDraft {
    const receipt = task.receipt;

    return {
      donorName: receipt?.donorName || task.donorName,
      receiptTitle: receipt?.receiptTitle || task.receiptTitle || task.donorName,
      agencyName: receipt?.agencyName || this.defaultAgencyName,
      agencyNameEn: receipt?.agencyNameEn ?? '',
      orgTaxId: receipt?.orgTaxId ?? '',
      approvalNo: receipt?.approvalNo ?? '',
      donorIdNo: receipt?.donorIdNo || task.taxId,
      donorAddress: receipt?.donorAddress ?? '',
      donorPhone: receipt?.donorPhone || task.phone,
      donationItem: receipt?.donationItem || this.describeDonation(task),
      donationDate: (receipt?.donationDate || task.donationDate).slice(0, 10),
      note: receipt?.note ?? '',
      accountName: receipt?.accountName ?? '',
      postalAccount: receipt?.postalAccount ?? '',
      orgPhone: receipt?.orgPhone ?? '',
      orgFax: receipt?.orgFax ?? '',
      orgEmail: receipt?.orgEmail ?? '',
      orgAddress: receipt?.orgAddress ?? '',
      handlerName: receipt?.handlerName ?? '',
      largeSealUrl: receipt?.largeSealUrl ?? '',
      smallSealUrl: receipt?.smallSealUrl ?? '',
    };
  }

  /**
   * 尚未開立時新增收據；已開立時更新內容，收據編號與開立日期維持不變。
   */
  async saveReceipt(task: AgencyReceiptTask, draft: ReceiptDraft, seals: ReceiptSealFiles = { largeSeal: null, smallSeal: null }): Promise<void> {
    if (!task.needReceipt) {
      throw new Error('此筆捐助未申請收據');
    }

    if (!task.donorUid) {
      throw new Error('缺少捐助者會員編號，無法開立收據');
    }

    const donorName = draft.donorName.trim();
    const payload = {
      donorName,
      receiptTitle: draft.receiptTitle.trim() || donorName,
      agencyName: draft.agencyName.trim(),
      agencyNameEn: draft.agencyNameEn.trim(),
      orgTaxId: draft.orgTaxId.trim(),
      approvalNo: draft.approvalNo.trim(),
      donorIdNo: draft.donorIdNo.trim(),
      donorAddress: draft.donorAddress.trim(),
      donorPhone: draft.donorPhone.trim(),
      donationItem: draft.donationItem.trim(),
      donationDate: draft.donationDate,
      note: draft.note.trim(),
      accountName: draft.accountName.trim(),
      postalAccount: draft.postalAccount.trim(),
      orgPhone: draft.orgPhone.trim(),
      orgFax: draft.orgFax.trim(),
      orgEmail: draft.orgEmail.trim(),
      orgAddress: draft.orgAddress.trim(),
      handlerName: draft.handlerName.trim(),
      largeSealUrl: await this.resolveSealUrl(draft.largeSealUrl, seals.largeSeal, task.donationId, 'large'),
      smallSealUrl: await this.resolveSealUrl(draft.smallSealUrl, seals.smallSeal, task.donationId, 'small'),
    };

    if (!payload.donorName || !payload.receiptTitle || !payload.agencyName || !payload.donationItem || !payload.donationDate) {
      throw new Error('請填寫收據抬頭、捐助者、受贈機構、捐贈內容與捐贈日期');
    }

    if (task.receipt) {
      const { error } = await this.supabaseService.client.from(this.receiptTable).update(payload).eq('id', task.receipt.id);

      if (error) {
        console.error('更新收據失敗：', error);
        throw error;
      }
    } else {
      const { error } = await this.supabaseService.client.from(this.receiptTable).insert({
        ...payload,
        receiptNo: await this.createReceiptNo(),
        donationId: task.donationId,
        donorUid: task.donorUid,
        issuedAt: new Date().toISOString(),
      });

      if (error) {
        console.error('開立收據失敗：', error);
        throw error;
      }
    }

    try {
      await this.publicThanks.syncFromReceipt(task.donationId, payload.agencyName, payload.donationItem);
    } catch (syncError) {
      console.error('同步感謝牆失敗：', syncError);
    }

    await this.loadTasks();
  }

  async uploadCertificate(task: AgencyReceiptTask, agencyName: string, file: File, note: string): Promise<void> {
    if (!task.needThankYou) {
      throw new Error('此筆捐助未申請感謝狀');
    }

    if (!task.donorUid) {
      throw new Error('缺少捐助者會員編號，無法上傳感謝狀');
    }

    const trimmedAgency = agencyName.trim();

    if (!trimmedAgency) {
      throw new Error('請填寫受贈機構名稱');
    }

    if (!CERTIFICATE_ACCEPT.includes(file.type)) {
      throw new Error('僅支援 PDF、JPG、PNG、WEBP');
    }

    if (file.size > CERTIFICATE_MAX_BYTES) {
      throw new Error('檔案大小不可超過 8MB');
    }

    const extension = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? 'bin') : 'bin';
    const storagePath = `${task.donorUid}/${task.donationId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await this.supabaseService.client.storage
      .from(this.certificateBucket)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('上傳感謝狀失敗：', uploadError);
      throw uploadError;
    }

    const { data: urlData } = this.supabaseService.client.storage.from(this.certificateBucket).getPublicUrl(storagePath);

    if (task.certificateUploaded) {
      const { error: deleteError } = await this.supabaseService.client
        .from(this.certificateTable)
        .delete()
        .eq('donationId', task.donationId);

      if (deleteError) {
        console.error('清除舊感謝狀紀錄失敗：', deleteError);
        throw deleteError;
      }
    }

    const { error } = await this.supabaseService.client.from(this.certificateTable).insert({
      donationId: task.donationId,
      donorUid: task.donorUid,
      agencyName: trimmedAgency,
      donationItem: task.actualMaterial || task.demandItem,
      donationDate: task.donationDate,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      mimeType: file.type,
      note: note.trim(),
      uploadedAt: new Date().toISOString(),
    });

    if (error) {
      console.error('寫入感謝狀紀錄失敗：', error);
      throw error;
    }

    await this.loadTasks();
  }

  async countPending(): Promise<number> {
    const tasks = await this.loadTasks();

    return tasks.filter((task) => this.isPending(task)).length;
  }

  isPending(task: AgencyReceiptTask): boolean {
    const waitReceipt = task.needReceipt && !task.receiptIssued;
    const waitCertificate = task.needThankYou && !task.certificateUploaded;

    return waitReceipt || waitCertificate;
  }

  isDone(task: AgencyReceiptTask): boolean {
    return !this.isPending(task);
  }

  private async loadDemandMap(demandIds: number[]): Promise<Map<number, string>> {
    const uniqueIds = [...new Set(demandIds.filter((id) => Number.isInteger(id) && id > 0))];
    const map = new Map<number, string>();

    if (uniqueIds.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseService.client.from(this.demandTable).select('id, item').in('id', uniqueIds);

    if (error) {
      console.error('讀取需求物資失敗：', error);
      return map;
    }

    for (const row of (data ?? []) as DemandRow[]) {
      map.set(row.id, row.item ?? '');
    }

    return map;
  }

  private async loadReceiptMap(donationIds: string[]): Promise<Map<string, ReceiptRow>> {
    const map = new Map<string, ReceiptRow>();

    if (donationIds.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseService.client
      .from(this.receiptTable)
      .select(
        'id, donationId, receiptNo, donorName, receiptTitle, agencyName, agencyNameEn, orgTaxId, approvalNo, donorIdNo, donorAddress, donorPhone, donationItem, donationDate, note, accountName, postalAccount, orgPhone, orgFax, orgEmail, orgAddress, handlerName, issuedAt, largeSealUrl, smallSealUrl'
      )
      .in('donationId', donationIds);

    if (error) {
      console.error('讀取已開立收據失敗：', error);
      return map;
    }

    for (const row of (data ?? []) as ReceiptRow[]) {
      if (row.donationId) {
        map.set(row.donationId, row);
      }
    }

    return map;
  }

  private async loadCertificateMap(donationIds: string[]): Promise<Map<string, CertificateRow>> {
    const map = new Map<string, CertificateRow>();

    if (donationIds.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseService.client
      .from(this.certificateTable)
      .select('donationId, fileName')
      .in('donationId', donationIds);

    if (error) {
      console.error('讀取已上傳感謝狀失敗：', error);
      return map;
    }

    for (const row of (data ?? []) as CertificateRow[]) {
      if (row.donationId) {
        map.set(row.donationId, row);
      }
    }

    return map;
  }

  private async createReceiptNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RC-${year}-`;

    const { data, error } = await this.supabaseService.client
      .from(this.receiptTable)
      .select('receiptNo')
      .like('receiptNo', `${prefix}%`)
      .order('receiptNo', { ascending: false })
      .limit(1);

    if (error) {
      console.error('產生收據編號失敗：', error);
      throw error;
    }

    const latest = (data?.[0] as { receiptNo?: string } | undefined)?.receiptNo ?? '';
    const latestSeq = Number(latest.replace(prefix, ''));
    const nextSeq = Number.isFinite(latestSeq) ? latestSeq + 1 : 1;

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  private describeDonation(task: AgencyReceiptTask): string {
    const material = task.actualMaterial || task.demandItem;
    const method = task.donationMethod ? `（${task.donationMethod}）` : '';

    return `${material} ${task.quantity}${method}`.trim();
  }

  private mapReceipt(row: ReceiptRow): IssuedDonationReceipt {
    return {
      id: row.id,
      receiptNo: row.receiptNo,
      donorName: row.donorName ?? '',
      receiptTitle: row.receiptTitle ?? '',
      agencyName: row.agencyName ?? '',
      agencyNameEn: row.agencyNameEn ?? '',
      orgTaxId: row.orgTaxId ?? '',
      approvalNo: row.approvalNo ?? '',
      donorIdNo: row.donorIdNo ?? '',
      donorAddress: row.donorAddress ?? '',
      donorPhone: row.donorPhone ?? '',
      donationItem: row.donationItem ?? '',
      donationDate: row.donationDate ?? '',
      note: row.note ?? '',
      accountName: row.accountName ?? '',
      postalAccount: row.postalAccount ?? '',
      orgPhone: row.orgPhone ?? '',
      orgFax: row.orgFax ?? '',
      orgEmail: row.orgEmail ?? '',
      orgAddress: row.orgAddress ?? '',
      handlerName: row.handlerName ?? '',
      issuedAt: row.issuedAt ?? '',
      largeSealUrl: row.largeSealUrl ?? '',
      smallSealUrl: row.smallSealUrl ?? '',
    };
  }

  private async resolveSealUrl(currentUrl: string, file: File | null, donationId: string, kind: 'large' | 'small'): Promise<string> {
    if (!file) {
      return currentUrl.startsWith('blob:') ? '' : currentUrl;
    }

    if (!SEAL_ACCEPT.includes(file.type)) {
      throw new Error('大小章僅支援 PNG、JPG、WEBP');
    }

    if (file.size > SEAL_MAX_BYTES) {
      throw new Error('大小章圖片不可超過 2MB');
    }

    const extension = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? 'png') : 'png';
    const storagePath = `seals/${donationId}/${kind}-${Date.now()}.${extension}`;

    const { error } = await this.supabaseService.client.storage.from(this.certificateBucket).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error('上傳機構章失敗：', error);
      throw error;
    }

    const { data } = this.supabaseService.client.storage.from(this.certificateBucket).getPublicUrl(storagePath);

    return data.publicUrl;
  }
}
