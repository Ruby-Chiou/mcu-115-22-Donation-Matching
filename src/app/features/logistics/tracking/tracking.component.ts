import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DonorDonationHistoryService } from '../../../core/services/member-center/donor-donation-history.service';
import { DonorDonationHistory } from '../../../models/member/donation-history';
import { RECEIPT_CARRIERS } from '../../../models/agency/receipt-issuance';

interface CarrierOption {
  value: string;
  name: string;
}

interface ShipmentResult {
  donationId: string;
  carrier: string;
  trackingNo: string;
  material: string;
  recipient: string;
  status: string;
  officialUrl: string;
}

interface NoticeDialog {
  title: string;
  body: string;
  officialUrl: string;
  officialName: string;
}

const OFFICIAL_SITES: Record<string, string> = {
  黑貓宅急便: 'https://www.t-cat.com.tw/inquire/trace.aspx',
  '7-ELEVEN': 'https://eservice.7-11.com.tw/E-Tracking/search.aspx',
  全家: 'https://www.family.com.tw/Marketing/Convenience/Index.aspx',
  中華郵政: 'https://postserv.post.gov.tw/pstmail/main_mail.html',
  新竹物流: 'https://www.hct.com.tw/Search/SearchGoods_n.aspx',
};

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
})
export class TrackingComponent implements OnInit {
  private readonly history = inject(DonorDonationHistoryService);
  private readonly route = inject(ActivatedRoute);

  showResult = false;
  searching = false;
  keyword = '';
  selectedCarrier = 'auto';
  resultList: ShipmentResult[] = [];
  notice: NoticeDialog | null = null;

  readonly carriers: CarrierOption[] = [
    { value: 'auto', name: '依捐助紀錄' },
    ...RECEIPT_CARRIERS.map((name) => ({ value: name, name })),
  ];

  ngOnInit(): void {
    const trackingNo = this.route.snapshot.queryParamMap.get('no')?.trim() ?? '';
    const carrier = this.route.snapshot.queryParamMap.get('carrier')?.trim() ?? '';

    if (!trackingNo) {
      return;
    }

    this.keyword = trackingNo;
    this.selectedCarrier = RECEIPT_CARRIERS.includes(carrier as (typeof RECEIPT_CARRIERS)[number]) ? carrier : 'auto';
    void this.search();
  }

  async search(): Promise<void> {
    const keyword = this.keyword.trim();
    this.showResult = false;
    this.resultList = [];

    if (!keyword) {
      this.openNotice('請輸入物流單號', '請輸入你在捐助紀錄上傳的單號。這裡只查平台上的寄送捐助，沒有另外的測試資料。', '', '');
      return;
    }

    this.searching = true;

    try {
      await this.history.loadHistory();
    } catch {
      this.openNotice('無法讀取捐助紀錄', '請先以捐助者身分登入。配送進度來自你在捐助紀錄上傳的物流單號。', '', '');
      this.searching = false;
      return;
    }

    this.searching = false;

    const matches = this.history.records().filter((record) => record.trackingNo.trim() === keyword);
    const carrierName = this.selectedCarrier === 'auto' ? '' : this.selectedCarrier;
    const scoped = carrierName ? matches.filter((record) => record.logisticsCarrier === carrierName) : matches;

    if (scoped.length > 0) {
      this.resultList = scoped.map((record) => this.toResult(record));
      this.showResult = true;
      return;
    }

    if (matches.length > 0) {
      const actual = matches[0].logisticsCarrier || '尚未填寫物流公司';
      this.openNotice(
        '物流公司與捐助紀錄不同',
        `這筆單號在你的捐助紀錄裡是「${actual}」。請改選該物流公司，或改為「依捐助紀錄」。`,
        OFFICIAL_SITES[actual] ?? '',
        actual
      );
      return;
    }

    const guessed = this.detectCarrier(keyword);
    this.openNotice(
      '平台沒有這筆寄送資料',
      guessed
        ? `捐助紀錄裡沒有單號 ${keyword}。若你已經寄出，請先回到該筆捐助上傳單號。單號格式比較像「${guessed}」，最新貨態請到該物流公司官網查。`
        : `捐助紀錄裡沒有單號 ${keyword}。請確認是你在審核通過後上傳的單號，或到物流公司官網查最新貨態。`,
      guessed ? OFFICIAL_SITES[guessed] : '',
      guessed
    );
  }

  closeNotice(): void {
    this.notice = null;
  }

  goToCarrier(carrier: string, event: Event): void {
    event.preventDefault();
    const url = OFFICIAL_SITES[carrier];

    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private toResult(record: DonorDonationHistory): ShipmentResult {
    const carrier = record.logisticsCarrier || '尚未選擇物流公司';

    return {
      donationId: record.id,
      carrier,
      trackingNo: record.trackingNo,
      material: record.actualMaterial || record.demandItem,
      recipient: record.recipient,
      status: record.receiptConfirmedAt ? '受助機構已簽收' : '已寄出，等待受助機構簽收',
      officialUrl: OFFICIAL_SITES[carrier] ?? '',
    };
  }

  private openNotice(title: string, body: string, officialUrl: string, officialName: string): void {
    this.notice = { title, body, officialUrl, officialName };
  }

  private detectCarrier(keyword: string): string {
    if (/^\d{10,12}$/.test(keyword)) {
      return '黑貓宅急便';
    }

    if (/^\d{8}$/.test(keyword) || /^\d{11}$/.test(keyword)) {
      return '7-ELEVEN';
    }

    return '';
  }
}
