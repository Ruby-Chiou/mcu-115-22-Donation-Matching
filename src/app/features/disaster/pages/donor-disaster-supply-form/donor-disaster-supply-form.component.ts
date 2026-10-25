import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DonorReceiptRequestComponent } from '../../../../components/receipt/donor-receipt-request/donor-receipt-request.component';
import { MemberProfileService } from '../../../../core/services/member-center/member-profile.service';
import { ReceiptLineItem, emptyReceiptLine, validateDonorReceiptRequest } from '../../../../core/receipt/donation-receipt-document';

@Component({
  selector: 'app-donor-disaster-supply-form',
  imports: [FormsModule, CommonModule, DonorReceiptRequestComponent],
  templateUrl: './donor-disaster-supply-form.component.html',
  styleUrl: './donor-disaster-supply-form.component.scss',
})
export class DonorDisasterSupplyFormComponent implements OnInit {
  demand: DisasterDemand | undefined;
  // 目前這筆需求最多可以捐多少
  maxDonationQuantity = 0;
  donorName = '';
  phone = '';
  // 自動填入帳戶資料
  useAccountInfo = false;
  // 之後如果有登入系統，可以改成從會員資料取得
  accountName = '王小明';
  accountPhone = '0912345678';
  actualMaterial = '';
  quantity: number | null = null;
  note = '';
  needReceipt = '';
  donorEmail = '';
  donorIdNo = '';
  receiptLines: ReceiptLineItem[] = [];
  receiptAgreed = false;
  handoverMethod = '寄送';
  private profileName = '';
  private profilePhone = '';
  private profileEmail = '';
  needThankYou = '';
  proofFile: File | null = null;
  proofFileName = '';

  submitted = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disasterDemandService: DisasterDemandService,
    private profileService: MemberProfileService,
    private cdr: ChangeDetectorRef
  ) {}
  // 初始化  //
  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      alert('找不到需求資料');
      void this.router.navigate(['/donor/disaster']);
      return;
    }

    try {
      const demand = await this.disasterDemandService.getDemandById(id);

      if (!demand) {
        alert('此需求不存在或已失效');
        void this.router.navigate(['/donor/disaster']);
        return;
      }
      
      this.demand = demand;
      this.maxDonationQuantity = demand.remaining ?? 0;
      await this.loadProfileDefaults();
      this.cdr.detectChanges();
    } catch (error) {
      alert('讀取需求或更新畫面失敗，請查看 Console');
    }
  }
  // 優先程度 CSS  //
  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case '高':
        return 'priority-high';
      case '中':
        return 'priority-medium';
      case '低':
        return 'priority-low';
      default:
        return '';
    }
  }
  // 是否需要上傳證明  //
  get needProofUpload(): boolean {
    return this.needReceipt === 'yes' || this.needThankYou === 'yes';
  }
  // 自動填入帳戶資料  //
  fillAccountInfo(): void {
    if (this.useAccountInfo) {
      this.donorName = this.profileName || this.accountName;
      this.phone = this.profilePhone || this.accountPhone;
      if (!this.donorEmail) {
        this.donorEmail = this.profileEmail;
      }
    } else {
      this.donorName = '';
      this.phone = '';
    }
  }

  onNeedReceiptChange(value: string): void {
    this.needReceipt = value;

    if (value !== 'yes') {
      this.receiptAgreed = false;
      return;
    }

    if (!this.donorName) {
      this.donorName = this.profileName;
    }

    if (!this.phone) {
      this.phone = this.profilePhone;
    }

    if (!this.donorEmail) {
      this.donorEmail = this.profileEmail;
    }

    if (this.receiptLines.length === 0) {
      this.receiptLines = [emptyReceiptLine(this.actualMaterial || this.demand?.item || '', this.quantity && this.quantity > 0 ? this.quantity : 1)];
    }
  }

  private async loadProfileDefaults(): Promise<void> {
    try {
      const profile = await this.profileService.loadProfile();
      this.profileName = profile.fullName || profile.displayName || '';
      this.profilePhone = profile.phoneNumber || '';
      this.profileEmail = profile.email || '';

      if (!this.donorName) {
        this.donorName = this.profileName;
      }

      if (!this.phone) {
        this.phone = this.profilePhone;
      }

      this.donorEmail = this.donorEmail || this.profileEmail;
    } catch {
      // 未登入時改由捐助者自行填寫。
    }
  }
  // 限制捐贈數量  //
  limitQuantityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // 沒有輸入
    if (!input.value) {
      this.quantity = null;
      return;
    }
    let value = Number(input.value);
    // 最少 1
    if (value < 1) {
      value = 1;
    }
    // 不可以超過剩餘需求
    if (value > this.maxDonationQuantity) {
      value = this.maxDonationQuantity;
    }
    input.value = value.toString();
    this.quantity = value;
  }
  // 設定捐贈數量//
  setQuantity(value: number | null): void {
    if (value === null || value === undefined) {
      this.quantity = null;
      return;
    }
    if (value < 1) {
      this.quantity = 1;
      return;
    }
    if (value > this.maxDonationQuantity) {
      this.quantity = this.maxDonationQuantity;
      return;
    }
    this.quantity = value;
  }
  // textarea 自動增加高度  //
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  // 選擇捐贈完成證明  //
  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.proofFile = input.files[0];
    this.proofFileName = this.proofFile.name;
  }
  // 上傳捐贈完成證明  //
  uploadProof(): void {
    if (!this.proofFile) {
      alert('請先選擇捐贈完成證明');
      return;
    }
    console.log('捐贈完成證明：', this.proofFile);
    alert('捐贈完成證明已上傳，等待受助單位確認。');
  }
  // 提交捐贈表單  //
  submitForm(): void {
    // 基本資料檢查
    if (!this.donorName || !this.actualMaterial || !this.quantity || !this.needReceipt || !this.needThankYou) {
      alert('請填寫完整的捐贈資料');
      return;
    }
    // 檢查數量
    if (this.quantity < 1 || this.quantity > this.maxDonationQuantity) {
      alert(`捐贈數量不可超過剩餘需求 ${this.maxDonationQuantity} ${this.demand?.unit ?? ''}`);
      return;
    }
    if (this.needReceipt === 'yes') {
      const receiptError = validateDonorReceiptRequest({
        donorName: this.donorName,
        donorPhone: this.phone,
        donorEmail: this.donorEmail,
        donorIdNo: this.donorIdNo,
        lines: this.receiptLines,
        handoverMethod: this.handoverMethod,
        agreed: this.receiptAgreed,
      });

      if (receiptError) {
        alert(receiptError);
        return;
      }
    }
    // 模擬送出資料    //
    console.log('捐贈申請資料：', {
      demandId: this.demand?.id,
      donorName: this.donorName,
      phone: this.phone,
      actualMaterial: this.actualMaterial,
      quantity: this.quantity,
      unit: this.demand?.unit,
      needReceipt: this.needReceipt,
      donorEmail: this.donorEmail,
      donorIdNo: this.donorIdNo,
      receiptLines: this.receiptLines,
      needThankYou: this.needThankYou,
      note: this.note,
    });
    // 顯示成功頁面
    this.submitted = true;
  }
  // 取消  //
  cancelForm(): void {
    this.router.navigate(['/donor/disaster']);
  }
  // 完成後返回災害救助//
  goToDisasterOpen(): void {
    this.router.navigate(['/donor/disaster']);
  }
}
