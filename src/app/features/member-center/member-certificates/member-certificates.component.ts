import { DatePipe, formatDate } from '@angular/common';
import { Component, HostListener, LOCALE_ID, OnInit, inject, signal } from '@angular/core';

import { DonationCertificateService } from '../../../core/services/member-center/donation-certificate.service';
import { DonationCertificate } from '../../../models/member/donation-certificate';

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

@Component({
  selector: 'app-member-certificates',
  imports: [DatePipe],
  templateUrl: './member-certificates.component.html',
  styleUrl: './member-certificates.component.scss',
})
export class MemberCertificatesComponent implements OnInit {
  private readonly locale = inject(LOCALE_ID);
  protected readonly certificateService = inject(DonationCertificateService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly selected = signal<DonationCertificate | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.certificateService.loadCertificates();
    } catch {
      this.errorText.set('無法載入感謝狀，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  open(certificate: DonationCertificate): void {
    this.selected.set(certificate);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.selected.set(null);
  }

  print(certificate: DonationCertificate): void {
    const printWindow = window.open('', '_blank', 'width=1000,height=750');

    if (!printWindow) {
      window.alert('請允許瀏覽器開啟彈出視窗以列印感謝狀');
      return;
    }

    printWindow.document.write(this.buildPrintHtml(certificate));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private buildPrintHtml(certificate: DonationCertificate): string {
    const donationDate = formatDate(certificate.donationDate, 'yyyy 年 MM 月 dd 日', this.locale);
    const issuedAt = formatDate(certificate.issuedAt, 'yyyy 年 MM 月 dd 日', this.locale);

    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>感謝狀 ${escapeHtml(certificate.certificateNo)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { margin: 0; font-family: "Noto Serif TC", "PMingLiU", serif; color: #3e2c1c; }
  .certificate { box-sizing: border-box; height: 180mm; padding: 18mm 24mm; border: 6px double #b08d57; background: #fffaf0; text-align: center; }
  .no { text-align: right; font-size: 12pt; color: #7a6248; }
  h1 { margin: 6mm 0 10mm; font-size: 40pt; letter-spacing: 24px; color: #8b5a2b; }
  .donor { font-size: 22pt; margin-bottom: 8mm; }
  .message { font-size: 16pt; line-height: 2.1; text-align: justify; margin: 0 auto 8mm; max-width: 220mm; }
  .item { font-size: 14pt; margin-bottom: 12mm; }
  .footer { display: flex; justify-content: space-between; font-size: 14pt; }
  .footer .agency { text-align: right; line-height: 1.9; }
</style>
</head>
<body>
  <div class="certificate">
    <div class="no">字號：${escapeHtml(certificate.certificateNo)}</div>
    <h1>感謝狀</h1>
    <div class="donor">${escapeHtml(certificate.donorName)} 台鑒</div>
    <p class="message">${escapeHtml(certificate.message)}</p>
    <div class="item">捐贈內容：${escapeHtml(certificate.donationItem)}（${donationDate}）</div>
    <div class="footer">
      <div>中華民國 ${issuedAt}</div>
      <div class="agency">
        <div>${escapeHtml(certificate.agencyName)}</div>
        ${certificate.agencyRepresentative ? `<div>負責人 ${escapeHtml(certificate.agencyRepresentative)}</div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}
