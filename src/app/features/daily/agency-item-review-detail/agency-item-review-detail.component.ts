import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DonationService } from '../../../core/services/agency-daily-demand/daily-donation.service';

import { AgencyDonorContactComponent } from '../../agency/agency-donor-contact/agency-donor-contact.component';
import { DonationRecordLinksComponent } from '../../agency/agency-record-links/donation-record-links.component';
import { DonationFile, RecipientDonationReview } from '../../../models/agency/item-review';

@Component({
  selector: 'app-agency-item-review-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DonationRecordLinksComponent, AgencyDonorContactComponent],
  templateUrl: './agency-item-review-detail.component.html',
  styleUrl: './agency-item-review-detail.component.scss',
})
export class AgencyItemReviewDetailComponent implements OnInit {
  donation: RecipientDonationReview | null = null;

  isLoading = false;
  errorMessage = '';

  files: DonationFile[] = [];
  conditions: string[] = [];

  selectedImage: DonationFile | null = null;

  selectedVideo: DonationFile | null = null;

  isRejectModalOpen = false;
  isSubmittingDecision = false;
  isRunningAi = false;
  aiActionMessage = '';

  humanReasonControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly donationService: DonationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const donationId = this.route.snapshot.paramMap.get('id');

    if (!donationId) {
      this.errorMessage = '找不到物資資料 ID。';
      return;
    }

    await this.loadDonation(donationId);
  }

  async loadDonation(donationId: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.donation = await this.donationService.getRecipientDonationReviewById(donationId);

      this.conditions = await this.donationService.getDemandConditions(this.donation.demand_id);

      this.files = await this.donationService.getDonationFiles(donationId);
    } catch (error) {
      console.error('讀取物資詳細資料失敗：', error);

      this.errorMessage = '無法讀取物資詳細資料，請稍後再試。';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getAcceptedConditionsText(): string {
    return this.conditions
      .filter((condition) => {
        const normalizedCondition = condition.replace('：', ':');

        const [_conditionName, decision] = normalizedCondition.split(':', 2);

        return decision?.trim() === '接受';
      })
      .map((condition) => {
        const normalizedCondition = condition.replace('：', ':');

        const [conditionName] = normalizedCondition.split(':', 2);

        return conditionName.trim();
      })
      .join('、');
  }

  getAiDecisionText(decision: string | null): string {
    if (decision === 'accepted') {
      return '通過';
    }

    if (decision === 'rejected') {
      return '不通過';
    }

    return '等待 AI 審核';
  }

  getStatusText(donation: RecipientDonationReview): string {
    switch (donation.status) {
      case 'pending_human_review':
        return '機構審核中';

      case 'human_approved':
        return '已接受';

      case 'human_rejected':
        return '未通過';

      case 'needs_supplement':
        return '待捐助者補件';

      case 'pending_ai_review':
        return 'AI 審核中';

      default:
        return '處理中';
    }
  }

  /** 與列表／捐助者端一致：沒照片時不要硬顯示未通過，除非 AI 已判定需補件。 */
  aiDecisionLabel(donation: RecipientDonationReview): string {
    if (donation.status === 'needs_supplement') {
      return '不通過（待補件）';
    }

    if (donation.ai_decision === 'accepted' || donation.ai_decision === 'rejected') {
      return this.getAiDecisionText(donation.ai_decision);
    }

    if (!this.hasMaterialMedia) {
      return '尚無媒體，待補件後再審';
    }

    return this.getAiDecisionText(donation.ai_decision);
  }

  get imageFiles(): DonationFile[] {
    return this.files.filter((file) => file.file_type === 'material_image');
  }

  get videoFiles(): DonationFile[] {
    return this.files.filter((file) => file.file_type === 'material_video');
  }

  openImage(file: DonationFile): void {
    if (!file.public_url) {
      return;
    }

    this.selectedVideo = null;
    this.selectedImage = file;
  }

  closeImage(): void {
    this.selectedImage = null;
  }

  openVideo(file: DonationFile): void {
    if (!file.public_url) {
      return;
    }

    this.selectedImage = null;
    this.selectedVideo = file;
  }

  closeVideo(): void {
    this.selectedVideo = null;
  }

  openRejectModal(): void {
    if (this.isSubmittingDecision || this.donation?.status !== 'pending_human_review') {
      return;
    }

    this.humanReasonControl.reset('');
    this.isRejectModalOpen = true;
  }

  closeRejectModal(): void {
    if (this.isSubmittingDecision) {
      return;
    }

    this.isRejectModalOpen = false;
    this.humanReasonControl.reset('');
  }

  get hasMaterialMedia(): boolean {
    return this.imageFiles.length > 0 || this.videoFiles.length > 0;
  }

  /** 卡在 AI 審核時，機構可手動重跑或改走人工，方便確認 AI 有沒有在跑。 */
  async rerunAiReview(): Promise<void> {
    if (!this.donation || this.isRunningAi || this.donation.status !== 'pending_ai_review') {
      return;
    }

    const donationId = this.getDonationId();
    if (!donationId) {
      this.errorMessage = '找不到物資資料 ID。';
      return;
    }

    this.isRunningAi = true;
    this.aiActionMessage = '正在呼叫 AI 審核…';
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const result = await this.donationService.runAiReviewAfterSubmit(donationId);
      this.aiActionMessage = `AI 回應：${result.decisionText || result.status}（判定 ${result.decision || '無'}）`;
      await this.loadDonation(donationId);
    } catch (error) {
      console.error('手動重跑 AI 失敗：', error);
      this.aiActionMessage = '';
      this.errorMessage = error instanceof Error ? error.message : 'AI 沒有回應，請稍後再試或改走人工審核。';
    } finally {
      this.isRunningAi = false;
      this.cdr.detectChanges();
    }
  }

  async skipAiToHumanReview(): Promise<void> {
    if (!this.donation || this.isRunningAi || this.donation.status !== 'pending_ai_review') {
      return;
    }

    if (!this.hasMaterialMedia) {
      this.errorMessage = '沒有照片時不能轉人工接受流程，請先請捐助者補件。';
      return;
    }

    const donationId = this.getDonationId();
    if (!donationId) {
      this.errorMessage = '找不到物資資料 ID。';
      return;
    }

    this.isRunningAi = true;
    this.aiActionMessage = '正在改為機構人工審核…';
    this.errorMessage = '';

    try {
      const result = await this.donationService.skipAiToHumanReview(donationId);
      this.aiActionMessage = `已可人工審核：${result.decisionText || result.status}`;
      await this.loadDonation(donationId);
    } catch (error) {
      console.error('轉人工審核失敗：', error);
      this.aiActionMessage = '';
      this.errorMessage = error instanceof Error ? error.message : '無法改為人工審核，請稍後再試。';
    } finally {
      this.isRunningAi = false;
      this.cdr.detectChanges();
    }
  }

  async acceptDonation(): Promise<void> {
    if (!this.donation || this.isSubmittingDecision || this.donation.status !== 'pending_human_review') {
      return;
    }

    if (this.imageFiles.length === 0) {
      return;
    }

    const donationId = this.getDonationId();

    if (!donationId) {
      this.errorMessage = '找不到物資資料 ID。';
      return;
    }

    this.isSubmittingDecision = true;
    this.errorMessage = '';

    try {
      await this.donationService.updateHumanReviewDecision(donationId, 'accepted', null);

      this.donation = {
        ...this.donation,
        status: 'human_approved',
        human_decision: 'accepted',
        human_reason: null,
        human_checked_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('接受物資失敗：', error);

      this.errorMessage = '接受物資失敗，請稍後再試。';
    } finally {
      this.isSubmittingDecision = false;
      this.cdr.detectChanges();
    }
  }

  async rejectDonation(): Promise<void> {
    if (!this.donation || this.isSubmittingDecision || this.donation.status !== 'pending_human_review') {
      return;
    }

    this.humanReasonControl.markAsTouched();

    if (this.humanReasonControl.invalid) {
      return;
    }

    const humanReason = this.humanReasonControl.value.trim();

    if (humanReason.length < 2) {
      this.humanReasonControl.setErrors({
        minlength: true,
      });

      return;
    }

    const donationId = this.getDonationId();

    if (!donationId) {
      this.errorMessage = '找不到物資資料 ID。';
      return;
    }

    this.isSubmittingDecision = true;
    this.errorMessage = '';

    try {
      await this.donationService.updateHumanReviewDecision(donationId, 'rejected', humanReason);

      this.donation = {
        ...this.donation,
        status: 'human_rejected',
        human_decision: 'rejected',
        human_reason: humanReason,
        human_checked_at: new Date().toISOString(),
      };

      this.isRejectModalOpen = false;
      this.humanReasonControl.reset('');
    } catch (error) {
      console.error('不接受物資失敗：', error);

      this.errorMessage = '不接受物資失敗，請稍後再試。';
    } finally {
      this.isSubmittingDecision = false;
      this.cdr.detectChanges();
    }
  }

  private getDonationId(): string {
    return this.donation?.id || this.route.snapshot.paramMap.get('id') || '';
  }

  goBack(): void {
    void this.router.navigate(['/agency/item-review']);
  }
}
