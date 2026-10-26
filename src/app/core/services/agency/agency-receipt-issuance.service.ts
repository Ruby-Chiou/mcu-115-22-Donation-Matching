import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../../environment/environment';
import {
  DonationReceiptDocument,
  normalizeDonorId,
  lineFromItemText,
  packReceiptLogistics,
  parseReceiptLines,
  readReceiptLogistics,
  ReceiptLineItem,
  receiptPdfFileName,
  receiptNeedsResend,
  receiptQuantityTotal,
  summarizeReceiptLines,
  validateAgencyReceiptIssue,
} from '../../receipt/donation-receipt-document';
import { DonationReceiptPdfService } from '../../receipt/donation-receipt-pdf.service';
import { AgencyCertificateUploadService } from './agency-certificate-upload.service';
import { AgencyMemberMessageService } from './agency-member-message.service';
import { pdfBlob } from '../../receipt/receipt-file-download';
import { AgencyReceiptTask, IssuedDonationReceipt, ReceiptDraft, ReceiptSealFiles } from '../../../models/agency/receipt-issuance';
import { AGENCY_OFFICE } from '../../../models/user/agency';
import { SupabaseService } from '../database/supabase.service';
import { PublicDonationThankService } from '../member-center/public-donation-thank.service';

interface DonationRow {
  id: string;
  donor_uid: string | null;
  donor_name: string | null;
  phone: string | null;
  donor_email: string | null;
  donor_id_no: string | null;
  demand_id: number;
  actual_material: string | null;
  quantity: number | null;
  donation_method: string | null;
  receipt_title: string | null;
  receipt_lines: unknown;
  tax_id: string | null;
  need_receipt: boolean | null;
  need_thank_you: boolean | null;
  status: string;
  created_at: string;
  logistics_carrier: string | null;
  tracking_no: string | null;
  receipt_password_changed_at: string | null;
}

interface DemandRow {
  id: number;
  item: string | null;
  address: string | null;
}

interface ReceiptRow {
  id: number;
  donationId: string | null;
  receiptNo: string;
  donorName: string | null;
  receiptTitle: string | null;
  agencyName: string | null;
  donorIdNo: string | null;
  donorPhone: string | null;
  donorEmail: string | null;
  donationItem: string | null;
  donationDate: string | null;
  orgPhone: string | null;
  orgAddress: string | null;
  issuedAt: string | null;
  largeSealUrl: string | null;
  smallSealUrl: string | null;
  lineItems: unknown;
  handoverMethod: string | null;
  completedOn: string | null;
  pdfUrl: string | null;
  pdfFileName: string | null;
  pdfSentAt: string | null;
  note: string | null;
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
  private readonly receiptBucket = 'donor-receipts';

  private readonly supabaseService = inject(SupabaseService);
  private readonly publicThanks = inject(PublicDonationThankService);
  private readonly receiptPdf = inject(DonationReceiptPdfService);
  private readonly messages = inject(AgencyMemberMessageService);
  private readonly certificates = inject(AgencyCertificateUploadService);

  private readonly tasksSignal = signal<AgencyReceiptTask[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  readonly certificateAccept = CERTIFICATE_ACCEPT.join(',');
  readonly defaultAgencyName = AGENCY_OFFICE.agencyName;

  async loadTasks(): Promise<AgencyReceiptTask[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.donationTable)
      .select(
        `
        id,
        donor_uid,
        donor_name,
        phone,
        donor_email,
        donor_id_no,
        demand_id,
        actual_material,
        quantity,
        donation_method,
        receipt_title,
        receipt_lines,
        tax_id,
        need_receipt,
        need_thank_you,
        status,
        created_at,
        logistics_carrier,
        tracking_no,
        receipt_password_changed_at
      `
      )
      .eq('status', 'human_approved')
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
      const fallbackQuantity = row.quantity && row.quantity > 0 ? row.quantity : 1;
      const issuedLines = receipt
        ? parseReceiptLines(receipt.lineItems, receipt.donationItem ?? '', fallbackQuantity)
        : [];
      const demand = demandMap.get(row.demand_id);
      const storedLogistics = readReceiptLogistics(receipt?.note);
      const receiptLines = issuedLines.some((line) => line.name)
        ? issuedLines
        : this.linesFromDonation(row, demand?.item ?? '');

      return {
        donationId: row.id,
        donorUid: row.donor_uid ?? environment.memberDemoUid ?? '',
        donorName: row.donor_name ?? '',
        phone: row.phone ?? '',
        donorEmail: row.donor_email ?? '',
        donorIdNo: row.donor_id_no || row.tax_id || '',
        demandId: row.demand_id,
        demandItem: demand?.item || '（需求已移除）',
        actualMaterial: row.actual_material ?? '',
        quantity: receiptQuantityTotal(receiptLines) || row.quantity || 0,
        donationMethod: row.donation_method ?? '',
        deliveryAddress: demand?.address || storedLogistics.deliveryAddress,
        logisticsCarrier: row.logistics_carrier || storedLogistics.logisticsCarrier,
        trackingNo: row.tracking_no || storedLogistics.trackingNo,
        receiptLines,
        receiptTitle: row.receipt_title || row.donor_name || '',
        needReceipt: !!row.need_receipt,
        passwordChanged: receiptNeedsResend(row.receipt_password_changed_at, receipt?.pdfSentAt ?? null, receipt?.issuedAt ?? null),
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
    const lines = receipt?.lines.length ? receipt.lines : this.linesFromTask(task);

    return {
      donorName: receipt?.donorName || task.donorName,
      donorPhone: receipt?.donorPhone || task.phone,
      donorEmail: receipt?.donorEmail || task.donorEmail,
      donorIdNo: receipt?.donorIdNo || task.donorIdNo,
      receiptTitle: receipt?.receiptTitle || task.receiptTitle || task.donorName,
      agencyName: AGENCY_OFFICE.agencyName,
      agencyAddress: AGENCY_OFFICE.officeAddress,
      agencyPhone: AGENCY_OFFICE.agencyPhone,
      deliveryAddress: task.deliveryAddress,
      logisticsCarrier: task.logisticsCarrier,
      trackingNo: task.trackingNo,
      lines,
      handoverMethod: task.donationMethod || receipt?.handoverMethod || '',
      completedOn: (receipt?.completedOn || task.donationDate).slice(0, 10),
      orgSealUrl: receipt?.orgSealUrl ?? '',
      officerSealUrl: receipt?.officerSealUrl ?? '',
    };
  }

  /** 捐助者更新開啟密碼後，用留存的密碼重做 PDF，信裡不附密碼。 */
  async resendReceipt(task: AgencyReceiptTask): Promise<void> {
    if (!task.receiptIssued || !task.receipt) {
      throw new Error('收據尚未開立，還不能重新發送');
    }

    if (!task.passwordChanged) {
      throw new Error('捐助者還沒有更新開啟密碼');
    }

    await this.saveReceipt(task, this.draftFromTask(task));
    await this.notifyDonor(
      task,
      `收據 ${task.receipt.receiptNo} 已重新發送`,
      '你更新了帳號密碼，受助機構已重新發送收據。請到會員收據下載，用你原來設定的開啟密碼開啟。這封信不會附上密碼。',
    );
  }

  async contactDonor(donorUid: string, donorName: string, content: string): Promise<void> {
    await this.messages.sendToDonor(donorUid, donorName, '關於你的捐助', content);
  }

  private async notifyDonor(target: { donorUid: string; donorName: string }, subject: string, content: string): Promise<void> {
    await this.messages.sendToDonor(target.donorUid, target.donorName, subject, content);
  }

  /**
   * 寫入收據內容後產生加密 PDF，並把檔案留在捐助者的收據紀錄。
   * 已開立的收據沿用原編號與開立日期。
   */
  async saveReceipt(task: AgencyReceiptTask, draft: ReceiptDraft, seals: ReceiptSealFiles = { orgSeal: null, officerSeal: null }): Promise<void> {
    if (!task.needReceipt) {
      throw new Error('此筆捐助未申請收據');
    }

    if (!task.donorUid) {
      throw new Error('缺少捐助者會員編號，無法開立收據');
    }

    const donorName = draft.donorName.trim();
    const donorIdNo = normalizeDonorId(draft.donorIdNo);
    const lines = draft.lines.map((line) => ({
      name: line.name.trim(),
      quantity: Number(line.quantity),
      unit: line.unit.trim(),
      estimatedPrice: line.estimatedPrice === null ? null : Number(line.estimatedPrice),
    }));
    const issueError = validateAgencyReceiptIssue({
      donorName,
      donorPhone: draft.donorPhone,
      donorEmail: draft.donorEmail,
      donorIdNo,
      agencyName: draft.agencyName,
      agencyAddress: draft.agencyAddress,
      agencyPhone: draft.agencyPhone,
      lines,
      handoverMethod: draft.handoverMethod,
      completedOn: draft.completedOn,
    });

    if (issueError) {
      throw new Error(issueError);
    }

    const handoverMethod = draft.handoverMethod.trim();
    const logisticsCarrier = handoverMethod === '寄送' ? draft.logisticsCarrier.trim() : '';
    const trackingNo = handoverMethod === '寄送' ? draft.trackingNo.trim() : '';

    if (handoverMethod === '寄送' && !logisticsCarrier) {
      throw new Error('寄送的收據要等捐助者選擇物流公司');
    }

    if (handoverMethod === '寄送' && !trackingNo) {
      throw new Error('寄送的收據要等捐助者上傳物流單號');
    }

    const donationItem = summarizeReceiptLines(lines);
    const payload = {
      donorName,
      receiptTitle: donorName,
      agencyName: draft.agencyName.trim(),
      donorIdNo,
      donorPhone: draft.donorPhone.trim(),
      donorEmail: draft.donorEmail.trim(),
      donationItem,
      donationDate: draft.completedOn,
      orgPhone: draft.agencyPhone.trim(),
      orgAddress: draft.agencyAddress.trim(),
      note: packReceiptLogistics({
        deliveryAddress: draft.deliveryAddress,
        logisticsCarrier,
        trackingNo,
      }),
      lineItems: lines,
      handoverMethod,
      completedOn: draft.completedOn,
      largeSealUrl: await this.resolveSealUrl(draft.orgSealUrl, seals.orgSeal, task.donationId, 'org'),
      smallSealUrl: await this.resolveSealUrl(draft.officerSealUrl, seals.officerSeal, task.donationId, 'officer'),
    };
    const issuedAt = task.receipt?.issuedAt || new Date().toISOString();
    const receiptNo = task.receipt?.receiptNo ?? (await this.createReceiptNo());

    if (task.receipt) {
      const { error } = await this.supabaseService.client.from(this.receiptTable).update(payload).eq('id', task.receipt.id);

      if (error) {
        console.error('更新收據失敗：', error);
        throw error;
      }
    } else {
      const { error } = await this.supabaseService.client.from(this.receiptTable).insert({
        ...payload,
        receiptNo,
        donationId: task.donationId,
        donorUid: task.donorUid,
        issuedAt,
      });

      if (error) {
        console.error('開立收據失敗：', error);
        throw error;
      }
    }

    const stored = await this.storeReceiptPdf(task, receiptNo, issuedAt, payload);

    const { error: pdfError } = await this.supabaseService.client
      .from(this.receiptTable)
      .update({ pdfUrl: stored.url, pdfFileName: stored.fileName, pdfSentAt: new Date().toISOString() })
      .eq('donationId', task.donationId);

    if (pdfError) {
      console.error('寫入收據檔案位置失敗：', pdfError);
      throw pdfError;
    }

    try {
      await this.publicThanks.syncFromReceipt(task.donationId, payload.agencyName, payload.donationItem);
    } catch (syncError) {
      console.error('同步感謝牆失敗：', syncError);
    }

    await this.loadTasks();
  }

  async uploadCertificate(task: AgencyReceiptTask, agencyName: string, file: File, note: string): Promise<void> {
    await this.certificates.upload({
      donationId: task.donationId,
      donorUid: task.donorUid,
      needThankYou: task.needThankYou,
      alreadyUploaded: task.certificateUploaded,
      agencyName,
      donationItem: task.actualMaterial || task.demandItem,
      donationDate: task.donationDate,
      file,
      note,
    });
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
    if (!task.needReceipt && !task.needThankYou) {
      return false;
    }

    return !this.isPending(task);
  }

  private async loadDemandMap(demandIds: number[]): Promise<Map<number, { item: string; address: string }>> {
    const uniqueIds = [...new Set(demandIds.filter((id) => Number.isInteger(id) && id > 0))];
    const map = new Map<number, { item: string; address: string }>();

    if (uniqueIds.length === 0) {
      return map;
    }

    const { data, error } = await this.supabaseService.client.from(this.demandTable).select('id, item, address').in('id', uniqueIds);

    if (error) {
      console.error('讀取需求物資失敗：', error);
      return map;
    }

    for (const row of (data ?? []) as DemandRow[]) {
      map.set(row.id, { item: row.item ?? '', address: row.address ?? '' });
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
        'id, donationId, receiptNo, donorName, receiptTitle, agencyName, donorIdNo, donorPhone, donorEmail, donationItem, donationDate, orgPhone, orgAddress, issuedAt, pdfSentAt, largeSealUrl, smallSealUrl, lineItems, handoverMethod, completedOn, pdfUrl, pdfFileName, note'
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

  private linesFromDonation(row: DonationRow, demandItem: string): ReceiptLineItem[] {
    const parsed = parseReceiptLines(row.receipt_lines);

    if (parsed.some((line) => line.name)) {
      return parsed;
    }

    return [lineFromItemText(row.actual_material || demandItem, row.quantity && row.quantity > 0 ? row.quantity : 1)];
  }

  private linesFromTask(task: AgencyReceiptTask): ReceiptLineItem[] {
    if (task.receiptLines.length > 0 && task.receiptLines.some((line) => line.name)) {
      return task.receiptLines.map((line) => ({
        ...line,
        quantity: line.quantity > 0 ? line.quantity : task.quantity || 1,
      }));
    }

    return [lineFromItemText(task.actualMaterial || task.demandItem, task.quantity > 0 ? task.quantity : 1)];
  }

  private mapReceipt(row: ReceiptRow): IssuedDonationReceipt {
    const completedOn = (row.completedOn || row.donationDate || '').slice(0, 10);

    return {
      id: row.id,
      receiptNo: row.receiptNo,
      donorName: row.donorName ?? '',
      donorPhone: row.donorPhone ?? '',
      donorEmail: row.donorEmail ?? '',
      donorIdNo: row.donorIdNo ?? '',
      receiptTitle: row.receiptTitle ?? '',
      agencyName: row.agencyName ?? '',
      agencyAddress: row.orgAddress ?? '',
      agencyPhone: row.orgPhone ?? '',
      lines: parseReceiptLines(row.lineItems, row.donationItem ?? ''),
      handoverMethod: row.handoverMethod ?? '',
      completedOn,
      ...readReceiptLogistics(row.note),
      donationItem: row.donationItem ?? '',
      issuedAt: row.issuedAt ?? '',
      pdfSentAt: row.pdfSentAt ?? '',
      orgSealUrl: row.largeSealUrl ?? '',
      officerSealUrl: row.smallSealUrl ?? '',
      pdfUrl: row.pdfUrl ?? '',
      pdfFileName: row.pdfFileName ?? '',
    };
  }

  private async storeReceiptPdf(
    task: AgencyReceiptTask,
    receiptNo: string,
    issuedAt: string,
    payload: {
      donorName: string;
      donorPhone: string;
      donorEmail: string;
      agencyName: string;
      orgAddress: string;
      orgPhone: string;
      lineItems: ReceiptLineItem[];
      handoverMethod: string;
      completedOn: string;
      note: string;
      largeSealUrl: string;
      smallSealUrl: string;
      donorIdNo: string;
    },
  ): Promise<{ url: string; fileName: string }> {
    const document: DonationReceiptDocument = {
      receiptNo,
      issuedOn: issuedAt.slice(0, 10),
      donorName: payload.donorName,
      donorPhone: payload.donorPhone,
      donorEmail: payload.donorEmail,
      agencyName: payload.agencyName,
      agencyAddress: payload.orgAddress,
      agencyPhone: payload.orgPhone,
      ...readReceiptLogistics(payload.note),
      lines: payload.lineItems,
      handoverMethod: payload.handoverMethod,
      completedOn: payload.completedOn,
      orgSealUrl: payload.largeSealUrl,
      officerSealUrl: payload.smallSealUrl,
    };
    const file = await this.receiptPdf.createProtectedFile(document, payload.donorIdNo);
    const storagePath = `${task.donorUid}/${task.donationId}/donation-receipt.pdf`;
    const { error } = await this.supabaseService.client.storage.from(this.receiptBucket).upload(storagePath, pdfBlob(file.bytes), {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (error) {
      console.error('留存收據 PDF 失敗：', error);
      throw error;
    }

    const { data } = this.supabaseService.client.storage.from(this.receiptBucket).getPublicUrl(storagePath);

    return {
      url: `${data.publicUrl}?v=${Date.now()}`,
      fileName: file.fileName || receiptPdfFileName(receiptNo),
    };
  }

  private async resolveSealUrl(currentUrl: string, file: File | null, donationId: string, kind: 'org' | 'officer'): Promise<string> {
    if (!file) {
      return currentUrl.startsWith('blob:') ? '' : currentUrl;
    }

    if (!SEAL_ACCEPT.includes(file.type)) {
      throw new Error('章印僅支援 PNG、JPG、WEBP');
    }

    if (file.size > SEAL_MAX_BYTES) {
      throw new Error('章印圖片不可超過 2MB');
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
