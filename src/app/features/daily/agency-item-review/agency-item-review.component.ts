import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DonationService } from '../../../core/services/agency-daily-demand/daily-donation.service';

import { RecipientDonationReview } from '../../../models/agency/item-review';

@Component({
  selector: 'app-agency-item-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agency-item-review.component.html',
  styleUrl: './agency-item-review.component.scss',
})
export class AgencyItemReviewComponent implements OnInit {
  donations: RecipientDonationReview[] = [];

  isLoading = false;
  errorMessage = '';

  selectedFilter: 'all' | 'accepted' | 'rejected' = 'all';

  /**
   * key：donation.id
   * value：這筆捐贈對應需求的 conditions
   */
  donationConditions = new Map<string, string[]>();

  constructor(
    private readonly donationService: DonationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.selectedFilter = 'all';
    await this.loadDonations();
  }

  async loadDonations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const donations = await this.donationService.getRecipientDonationReviews();

      this.donations = [...donations];

      await this.loadDonationConditions();

      this.selectedFilter = 'all';
    } catch (error) {
      console.error('讀取物資審核列表失敗：', error);

      this.errorMessage = '無法讀取物資審核列表，請稍後再試。';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * 每一筆 donation 用自己的 demand_id
   * 查詢 agency_daily_supply_items.conditions
   */
  private async loadDonationConditions(): Promise<void> {
    this.donationConditions.clear();

    await Promise.all(
      this.donations.map(async (donation) => {
        try {
          const conditions = await this.donationService.getDemandConditions(donation.demand_id);

          this.donationConditions.set(donation.id, conditions);
        } catch (error) {
          console.error('讀取需求 conditions 失敗：', error);

          this.donationConditions.set(donation.id, []);
        }
      })
    );
  }

  /**
   * 取得這筆物資對應的原始 conditions
   */
  getConditions(donation: RecipientDonationReview): string[] {
    return this.donationConditions.get(donation.id) ?? [];
  }

  /**
   * 只保留「接受」的狀態名稱
   *
   * 例如：
   * [
   *   '全新:接受',
   *   '二手:接受',
   *   '有擦痕:接受',
   *   '毀損:不接受'
   * ]
   *
   * 回傳：
   * ['全新', '二手', '有擦痕']
   */
  getAcceptedConditions(donation: RecipientDonationReview): string[] {
    return this.getConditions(donation)
      .filter((condition) => {
        const [_conditionName, decision] = condition.split(':', 2);

        return decision?.trim() === '接受';
      })
      .map((condition) => {
        const [conditionName] = condition.split(':', 2);

        return conditionName.trim();
      });
  }

  /**
   * 直接顯示：
   * 全新、二手、有擦痕
   */
  getAcceptedConditionsText(donation: RecipientDonationReview): string {
    return this.getAcceptedConditions(donation).join('、');
  }

  get pendingDonations(): RecipientDonationReview[] {
    return this.donations.filter((donation) => donation.status === 'pending_ai_review' || donation.status === 'pending_human_review');
  }

  get completedDonations(): RecipientDonationReview[] {
    return this.donations.filter((donation) => donation.status === 'human_approved' || donation.status === 'human_rejected');
  }

  filterByAiDecision(donations: RecipientDonationReview[]): RecipientDonationReview[] {
    if (this.selectedFilter === 'all') {
      return donations;
    }

    return donations.filter((donation) => donation.ai_decision === this.selectedFilter);
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

  getFinalDecisionText(donation: RecipientDonationReview): string {
    if (donation.status === 'human_approved') {
      return '已接受';
    }

    if (donation.status === 'human_rejected') {
      return '已不接受';
    }

    return '尚未決定';
  }

  openDonation(donation: RecipientDonationReview): void {
    void this.router.navigate(['/agency/item-review', donation.id]);
  }

  trackByDonationId(_index: number, donation: RecipientDonationReview): string {
    return donation.id;
  }
}
