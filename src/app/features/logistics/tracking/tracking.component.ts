import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface TrackingItem {
  id: string;
  carrier: string;
  status: string;
}

interface CarrierOption {
  value: string;
  name: string;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
})
export class TrackingComponent {

  // ==========================================
  // 查詢狀態
  // ==========================================

  showResult = false;

  keyword = '';

  selectedCarrier = 'auto';


  // ==========================================
  // 物流公司選項
  // ==========================================

  carriers: CarrierOption[] = [
    {
      value: 'auto',
      name: '自動辨識',
    },
    {
      value: 'black-cat',
      name: '黑貓宅急便',
    },
    {
      value: '711',
      name: '7-ELEVEN',
    },
    {
      value: 'family',
      name: '全家',
    },
    {
      value: 'post',
      name: '中華郵政',
    },
  ];


  // ==========================================
  // 模擬物流資料
  // ==========================================

  trackingList: TrackingItem[] = [
    {
      id: '123456789012',
      carrier: '黑貓宅急便',
      status: '配送中',
    },
    {
      id: '12345678',
      carrier: '7-ELEVEN',
      status: '寄件完成',
    },
    {
      id: '12345678901',
      carrier: '全家',
      status: '配送中',
    },
  ];


  resultList: TrackingItem[] = [];


  // ==========================================
  // 查詢
  // ==========================================

  search(): void {

    const keyword = this.keyword.trim();

    // 沒有輸入
    if (!keyword) {
      alert('請先輸入物流單號！');
      this.showResult = false;
      return;
    }


    // ------------------------------------------
    // 如果使用者自己選擇物流公司
    // ------------------------------------------

    if (this.selectedCarrier !== 'auto') {

      const isValid = this.checkFormat(
        keyword,
        this.selectedCarrier
      );

      if (!isValid) {

        alert(
          `此物流單號格式可能不符合「${this.getCarrierName(this.selectedCarrier)}」，請確認後再試一次。`
        );

        this.showResult = false;
        return;
      }
    }


    // ------------------------------------------
    // 自動辨識
    // ------------------------------------------

    const possibleCarriers = this.detectCarriers(keyword);


    // 沒有符合任何已知格式
    if (
      this.selectedCarrier === 'auto' &&
      possibleCarriers.length === 0
    ) {

      alert(
        '無法辨識此物流單號格式。\n請確認單號是否正確，或手動選擇物流公司。'
      );

      this.showResult = false;
      return;
    }


    // ------------------------------------------
    // 模擬資料庫查詢
    // ------------------------------------------

    this.resultList = this.trackingList.filter(
      item => item.id === keyword
    );


    // ------------------------------------------
    // 查不到測試資料
    // ------------------------------------------

    if (this.resultList.length === 0) {

      let message = '目前平台沒有這筆測試資料。';

      if (this.selectedCarrier === 'auto') {

        if (possibleCarriers.length === 1) {

          message =
            `此單號格式可能符合「${possibleCarriers[0]}」，\n` +
            '請至下方物流商官方網站確認最新貨態。';

        } else {

          message =
            `此單號格式可能符合：\n` +
            possibleCarriers.join('、') +
            '\n\n請選擇正確的物流公司後再查詢。';
        }

      } else {

        message =
          `此單號格式符合「${this.getCarrierName(this.selectedCarrier)}」。\n` +
          '請至下方物流商官方網站確認最新貨態。';
      }

      alert(message);

      this.showResult = false;
      return;
    }


    // 有查詢結果
    this.showResult = true;

    this.keyword = '';
  }


  // ==========================================
  // 自動辨識可能的物流公司
  // ==========================================

  detectCarriers(keyword: string): string[] {

    const carriers: string[] = [];


    // ------------------------------------------
    // 黑貓宅急便
    // 10～12 碼純數字
    // ------------------------------------------

    if (/^\d{10,12}$/.test(keyword)) {

      carriers.push('黑貓宅急便');
    }


    // ------------------------------------------
    // 7-ELEVEN
    // 官方 E-Tracking：
    // 寄件 8 碼 / 取件 11 碼
    // ------------------------------------------

    if (
      /^\d{8}$/.test(keyword) ||
      /^\d{11}$/.test(keyword)
    ) {

      carriers.push('7-ELEVEN');
    }


    // ------------------------------------------
    // 全家
    // 11 碼數字
    // 作為「可能」的格式判斷
    // ------------------------------------------

    if (/^\d{11}$/.test(keyword)) {

      carriers.push('全家');
    }


    return carriers;
  }


  // ==========================================
  // 指定物流公司的格式檢查
  // ==========================================

  checkFormat(
    keyword: string,
    carrier: string
  ): boolean {

    switch (carrier) {

      case 'black-cat':
        return /^\d{10,12}$/.test(keyword);


      case '711':
        return (
          /^\d{8}$/.test(keyword) ||
          /^\d{11}$/.test(keyword)
        );


      case 'family':
        return /^\d{11}$/.test(keyword);


      case 'post':
        // 中華郵政暫時不使用固定 Regex
        return keyword.length > 0;


      default:
        return true;
    }
  }


  // ==========================================
  // 取得物流公司名稱
  // ==========================================

  getCarrierName(carrier: string): string {

    const option = this.carriers.find(
      item => item.value === carrier
    );

    return option?.name ?? '';
  }


  // ==========================================
  // 前往物流商官方查詢網站
  // ==========================================

  goToCarrier(
    carrier: string,
    event: Event
  ): void {

    event.preventDefault();


    const urls: Record<string, string> = {

      'black-cat':
        'https://www.t-cat.com.tw/inquire/trace.aspx',

      '711':
        'https://eservice.7-11.com.tw/E-Tracking/search.aspx',

      'family':
        'https://www.family.com.tw/Marketing/Convenience/Index.aspx',

      'post':
        'https://postserv.post.gov.tw/pstmail/main_mail.html',
    };


    const url = urls[carrier];

    if (!url) {
      return;
    }


    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  }
}
