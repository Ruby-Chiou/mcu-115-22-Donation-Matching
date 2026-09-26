import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { DonationService } from '../../../core/services/agency-daily-demand/daily-donation.service';

import { DonationFile, RecipientDonationReview } from '../../../models/agency/item-review';

@Component({
  selector: 'app-agency-item-review-detail',
  standalone: true,
  imports: [CommonModule],
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
    if (donation.status === 'pending_human_review') {
      return '待最後決定';
    }

    if (donation.status === 'human_approved') {
      return '已接受';
    }

    if (donation.status === 'human_rejected') {
      return '已不接受';
    }

    return '處理中';
  }

  get imageFiles(): DonationFile[] {
    return this.files.filter((file) => file.file_type === 'material_image');
  }

  get videoFiles(): DonationFile[] {
    return this.files.filter((file) => file.file_type === 'material_video');
  }

  openImage(file: DonationFile): void {
    console.log('點擊圖片：', file);

    this.selectedImage = file;
  }

  closeImage(): void {
    this.selectedImage = null;
  }

  goBack(): void {
    void this.router.navigate(['/agency/item-review']);
  }
}
