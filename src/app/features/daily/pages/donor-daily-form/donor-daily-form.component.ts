import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { AiReviewResult, DonationService } from '../../../../core/services/agency-daily-demand/daily-donation.service';
import { DonorReceiptRequestComponent } from '../../../../components/receipt/donor-receipt-request/donor-receipt-request.component';
import { MemberProfileService } from '../../../../core/services/member-center/member-profile.service';
import { ReceiptLineItem, emptyReceiptLine, validateDonorReceiptRequest } from '../../../../core/receipt/donation-receipt-document';
import { maskDonorName } from '../../../../models/member/public-donation-thank';
@Component({
  selector: 'app-donor-daily-form',
  imports: [CommonModule, FormsModule, DonorReceiptRequestComponent],
  templateUrl: './donor-daily-form.component.html',
  styleUrl: './donor-daily-form.component.scss',
})
export class DonorDailyFormComponent implements OnInit {
  donationMethod: '寄送' | '面交' | '' = '';
  demand?: DailyDemand;
  private readonly demandId: number;

  // 圖片預覽
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';
  isSubmitting = false;
  isReviewing = false;
  reviewResult: AiReviewResult | null = null;
  reviewError = '';
  donationId = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly demandService: DailyDemandService,
    private readonly donationService: DonationService,
    private readonly profileService: MemberProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.demandId = Number(this.route.snapshot.paramMap.get('id'));
  }

  async ngOnInit(): Promise<void> {
    if (!Number.isInteger(this.demandId) || this.demandId <= 0) {
      console.error('網址中的物資需求 id 不正確：', this.demandId);

      return;
    }

    try {
      this.demand = await this.demandService.getDemandById(this.demandId);

      if (!this.demand) {
        console.error('找不到這筆物資需求資料，id：', this.demandId);

        return;
      }

      this.applyDefaultDonationMethod();
      await this.loadProfileDefaults();
    } catch (error) {
      console.error('讀取捐贈表單需求資料失敗：', error);
    }
  }

  get allowsShipping(): boolean {
    return !!this.demand?.receiveMethod?.寄送;
  }

  get allowsMeetup(): boolean {
    return !!this.demand?.receiveMethod?.面交;
  }

  /** 區塊編號：有捐贈方式時從 3 起算，否則從 2 起算。 */
  sectionNo(section: 'receipt' | 'thankYou' | 'publicThank' | 'other'): number {
    const base = this.allowsShipping || this.allowsMeetup ? 3 : 2;
    const offset = { receipt: 0, thankYou: 1, publicThank: 2, other: 3 }[section];
    return base + offset;
  }

  private applyDefaultDonationMethod(): void {
    if (this.allowsShipping && !this.allowsMeetup) {
      this.donationMethod = '寄送';
      return;
    }

    if (!this.allowsShipping && this.allowsMeetup) {
      this.donationMethod = '面交';
      return;
    }

    if (this.donationMethod === '面交' && !this.allowsMeetup) {
      this.donationMethod = this.allowsShipping ? '寄送' : '';
    }

    if (this.donationMethod === '寄送' && !this.allowsShipping) {
      this.donationMethod = this.allowsMeetup ? '面交' : '';
    }
  }

  private profileName = '';
  private profilePhone = '';
  private profileEmail = '';

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

      if (!this.donorEmail) {
        this.donorEmail = this.profileEmail;
      }
    } catch {
      // 未登入時改由捐助者自行填寫。
    }
  }
  cancelForm(): void {
    this.router.navigate(['/donor/daily/detail', this.demandId]);
  }
  donorName = '';
  phone = '';
  // 自動填入帳戶資料
  useAccountInfo = false;
  accountName = '王小明';
  accountPhone = '0912345678';
  actualMaterial = '';
  quantity: number | null = null;
  note = '';
  needReceipt = '';
  needThankYou = '';
  thankNameMode: '' | 'masked' | 'full' = '';
  thankPublic: '' | 'public' | 'private' = '';
  donorEmail = '';
  donorIdNo = '';
  receiptLines: ReceiptLineItem[] = [];
  receiptAgreed = false;
  proofFile: File | null = null;
  proofFileName = '';
  // 捐贈完成證明
  get maskedPreview(): string {
    return maskDonorName(this.donorName || '王小明');
  }

  get needProofUpload(): boolean {
    return this.needReceipt === 'yes' || this.needThankYou === 'yes';
  }
  // 自動填入帳戶資料
  fillAccountInfo() {
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
  // 捐贈者上傳的圖片
  materialFiles: File[] = [];

  // 圖片預覽用
  materialPreviewImages: string[] = [];

  onMaterialFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      return;
    }
  }
  // 是否已完成第一階段
  submitted = false;
  formSubmitted = false;
  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  // 選擇捐贈完成證明
  onProofSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.proofFile = input.files[0];
    this.proofFileName = this.proofFile.name;
  }
  // 上傳捐贈完成證明
  uploadProof() {
    if (!this.proofFile) {
      alert('請先選擇捐贈完成證明');
      return;
    }
    console.log('捐贈完成證明：', this.proofFile);
    alert('捐贈完成證明已上傳，等待受助單位確認。');
  }
  async submitForm(form: NgForm): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.formSubmitted = true;
    form.control.markAllAsTouched();

    if (form.invalid) {
      const firstInvalidField = document.querySelector<HTMLElement>('form .ng-invalid:not(form)');

      firstInvalidField?.focus();
      return;
    }

    if (this.materialFiles.length === 0) {
      alert('請先上傳物資照片');
      return;
    }

    if (this.needReceipt === 'yes') {
      const receiptError = validateDonorReceiptRequest({
        donorName: this.donorName,
        donorPhone: this.phone,
        donorEmail: this.donorEmail,
        donorIdNo: this.donorIdNo,
        lines: this.receiptLines,
        handoverMethod: this.donationMethod,
        agreed: this.receiptAgreed,
      });

      if (receiptError) {
        alert(receiptError);
        return;
      }
    }

    if (this.thankNameMode !== 'masked' && this.thankNameMode !== 'full') {
      alert('請選擇感謝牆要顯示匿名或全名');
      return;
    }

    if (this.thankPublic !== 'public' && this.thankPublic !== 'private') {
      alert('請選擇這筆捐助要不要出現在公開感謝牆');
      return;
    }

    if (!this.quantity || this.quantity <= 0) {
      alert('請輸入正確的捐贈數量');
      return;
    }

    if (this.donationMethod !== '寄送' && this.donationMethod !== '面交') {
      alert('請選擇捐贈方式');
      return;
    }

    if (this.donationMethod === '寄送' && !this.allowsShipping) {
      alert('此需求不接受寄送，請改選面交');
      return;
    }

    if (this.donationMethod === '面交' && !this.allowsMeetup) {
      alert('此需求不接受面交，請改選寄送');
      return;
    }

    this.isSubmitting = true;
    this.reviewResult = null;
    this.reviewError = '';

    try {
      console.log('開始送出捐助資料');

      const donation = await this.donationService.createDonation({
        demandId: this.demandId,
        donorName: this.donorName,
        phone: this.phone,
        actualMaterial: this.actualMaterial,
        quantity: this.quantity,
        donationMethod: this.donationMethod,
        note: this.note,
        needReceipt: this.needReceipt === 'yes',
        needThankYou: this.needThankYou === 'yes',
        thankNameMode: this.thankNameMode,
        thankPublic: this.thankPublic === 'public',
        receiptTitle: this.needReceipt === 'yes' ? this.donorName : null,
        taxId: this.needReceipt === 'yes' ? this.donorIdNo : null,
        donorEmail: this.needReceipt === 'yes' ? this.donorEmail : null,
        donorIdNo: this.needReceipt === 'yes' ? this.donorIdNo : null,
        receiptLines: this.needReceipt === 'yes' ? this.receiptLines : null,
        materialFiles: this.materialFiles,
        materialVideoFiles: this.materialVideoFiles,
      });

      console.log('捐助資料、圖片和影片已成功儲存：', donation);

      this.donationId = donation.id;

      // 上傳完成後立刻結束 loading
      this.isSubmitting = false;

      // 切換完成畫面
      this.submitted = true;

      // 立即要求 Angular 更新模板，再把視窗拉回頂端
      this.cdr.detectChanges();
      this.scrollSuccessToTop();

      // 背景執行 AI，不阻塞完成畫面
      void this.runAiReview(this.donationId);
    } catch (error) {
      console.error('寫入捐助資料失敗：', error);

      this.isSubmitting = false;
      this.cdr.detectChanges();

      alert(donationSubmitError(error));
    }
  }
  private async runAiReview(donationId: string): Promise<void> {
    this.isReviewing = true;
    this.reviewError = '';

    try {
      const result = await this.donationService.reviewDonationWithAi(donationId);

      this.reviewResult = result;

      console.log('AI 審核結果：', result);
    } catch (error) {
      console.error('AI 審核失敗：', error);

      this.reviewError = '照片已經送出。這次沒有辨識完成，機構會直接看照片確認。';
    } finally {
      this.isReviewing = false;
      this.cdr.detectChanges();
    }
  }

  goToHistory(): void {
    void this.router.navigate(['/donor/history']);
  }

  private scrollSuccessToTop(): void {
    const scroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    scroll();
    requestAnimationFrame(scroll);
  }
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 最多 5 張
    if (this.materialFiles.length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    // 加入捐贈表單自己的圖片
    this.materialFiles.push(file);

    // 建立預覽圖片
    const reader = new FileReader();

    reader.onload = () => {
      this.materialPreviewImages.push(reader.result as string);
    };

    reader.readAsDataURL(file);

    // 清空 input
    input.value = '';
  }
  removeImage(index: number): void {
    this.materialFiles.splice(index, 1);
    this.materialPreviewImages.splice(index, 1);
  }

  openImagePreview(image: string | undefined, imageName: string): void {
    if (!image) return;
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }
  materialVideoFiles: File[] = [];

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 檢查檔案大小：5MB
    if (file.size > 50 * 1024 * 1024) {
      alert('影片大小不能超過 5MB');
      input.value = '';
      return;
    }

    // 檢查是否為影片
    if (!file.type.startsWith('video/')) {
      alert('請選擇影片檔案');
      input.value = '';
      return;
    }

    // 最多 5 個媒體
    if (this.materialFiles.length + this.materialVideoFiles.length >= 5) {
      alert('最多只能上傳 5 個照片或影片');
      input.value = '';
      return;
    }
    this.materialVideoFiles.push(file);
    console.log('目前影片：', this.materialVideoFiles);
  }

  removeVideo(index: number): void {
    this.materialVideoFiles.splice(index, 1);
  }

  onNeedReceiptChange(value: string): void {
    this.needReceipt = value;

    if (value !== 'yes') {
      this.receiptAgreed = false;
      return;
    }

    if (!this.donorName && this.profileName) {
      this.donorName = this.profileName;
    }

    if (!this.phone && this.profilePhone) {
      this.phone = this.profilePhone;
    }

    if (!this.donorEmail) {
      this.donorEmail = this.profileEmail;
    }

    if (this.receiptLines.length === 0) {
      this.receiptLines = [emptyReceiptLine(this.actualMaterial || this.demand?.item || '', this.quantity && this.quantity > 0 ? this.quantity : 1)];
    }
  }
}

function donationSubmitError(error: unknown): string {
  const record = error as { message?: string } | null;
  const message = record?.message ?? '';

  if (/donor_daily_donations/i.test(message)) {
    return '捐助資料沒有寫入。請用捐助者帳號登入後再送一次。';
  }

  if (/donation_files|storage|row-level security|permission denied/i.test(message)) {
    return '物資照片沒有上傳，這筆捐助沒有完成。請稍後再送一次。';
  }

  return '捐助資料送出失敗，請稍後再試。';
}
