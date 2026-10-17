import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AgencyCertificateService } from '../../../../core/services/member-center/agency-certificate.service';
import {
  AgencyCertificate,
  certificateFormatLabel,
  isImageCertificate,
  isPdfCertificate,
} from '../../../../models/member/agency-certificate';

/**
 * 感謝狀列表：卡片內直接預覽。
 * 預覽用瀏覽器原生 img／embed；檔案應來自本專案 Supabase Storage。
 * 「開啟」= 新分頁瀏覽；「下載」= 強制存成檔案（fetch blob，避免跟開啟行為一樣）。
 */
@Component({
  selector: 'app-agency-certificate-list',
  imports: [DatePipe],
  templateUrl: './agency-certificate-list.component.html',
  styleUrl: './agency-certificate-list.component.scss',
})
export class AgencyCertificateListComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly certificateService = inject(AgencyCertificateService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly downloadingId = signal<number | null>(null);

  readonly isImage = isImageCertificate;
  readonly isPdf = isPdfCertificate;
  readonly formatLabel = certificateFormatLabel;

  async ngOnInit(): Promise<void> {
    try {
      await this.certificateService.loadCertificates();
    } catch {
      this.errorText.set('無法載入感謝狀檔案，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  pdfPreviewUrl(url: string): SafeResourceUrl {
    const withFit = url.includes('#') ? url : `${url}#view=FitH`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(withFit);
  }

  openInNewTab(certificate: AgencyCertificate): void {
    window.open(certificate.fileUrl, '_blank', 'noopener');
  }

  async downloadFile(certificate: AgencyCertificate): Promise<void> {
    this.downloadingId.set(certificate.id);

    try {
      const response = await fetch(certificate.fileUrl);

      if (!response.ok) {
        throw new Error(`下載失敗（${response.status}）`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = certificate.fileName || 'certificate';
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : '下載失敗，請稍後再試');
    } finally {
      this.downloadingId.set(null);
    }
  }
}
