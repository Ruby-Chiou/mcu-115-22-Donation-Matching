import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { DonationService } from '../../../core/services/agency-daily-demand/daily-donation.service';

import { RecipientDonationReview } from '../../../models/agency/item-review';

type ListScope = 'open' | 'done';
type CreatedWithin = 'all' | '7d' | '30d' | '90d';

@Component({
  selector: 'app-agency-item-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agency-item-review.component.html',
  styleUrl: './agency-item-review.component.scss',
})
export class AgencyItemReviewComponent implements OnInit {
  donations: RecipientDonationReview[] = [];

  isLoading = false;
  errorMessage = '';

  isFilterExpanded = false;
  searchTerm = '';
  listScope: ListScope = 'open';
  createdWithin: CreatedWithin = 'all';

  readonly aiDecisionOptions = [
    { value: 'accepted', label: '通過' },
    { value: 'rejected', label: '不通過' },
  ] as const;

  readonly createdWithinOptions: { value: CreatedWithin; label: string }[] = [
    { value: 'all', label: '全部時間' },
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: '90d', label: '近 90 天' },
  ];

  selectedFilters = {
    aiDecision: [] as string[],
    category: [] as string[],
    priority: [] as string[],
    receiveMethod: [] as string[],
  };

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
    await this.loadDonations();
  }

  async loadDonations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const donations = await this.donationService.getRecipientDonationReviews();

      this.donations = [...donations];

      await this.loadDonationConditions();
      this.pruneUnavailableFilters();
    } catch (error) {
      console.error('讀取物資審核列表失敗：', error);

      this.errorMessage = '無法讀取物資審核列表，請稍後再試。';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** 類別／優先度／接收方式：只顯示目前列表實際有的選項。 */
  get categoryOptions(): string[] {
    return this.uniqueSorted(this.donations.map((donation) => donation.demand_category ?? ''));
  }

  get priorityOptions(): string[] {
    return this.uniqueSorted(this.donations.map((donation) => donation.demand_priority ?? ''));
  }

  get receiveMethodOptions(): string[] {
    return this.uniqueSorted(this.donations.map((donation) => donation.donation_method ?? ''));
  }

  get openCount(): number {
    return this.openDonations.length;
  }

  get doneCount(): number {
    return this.doneDonations.length;
  }

  get openDonations(): RecipientDonationReview[] {
    return this.donations.filter((donation) => this.isOpenStatus(donation.status));
  }

  get doneDonations(): RecipientDonationReview[] {
    return this.donations.filter((donation) => this.isDoneStatus(donation.status));
  }

  get filteredDonations(): RecipientDonationReview[] {
    const source = this.listScope === 'open' ? this.openDonations : this.doneDonations;
    return this.filterDonations(source);
  }

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

  getConditions(donation: RecipientDonationReview): string[] {
    return this.donationConditions.get(donation.id) ?? [];
  }

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

  getAcceptedConditionsText(donation: RecipientDonationReview): string {
    return this.getAcceptedConditions(donation).join('、');
  }

  setListScope(scope: ListScope): void {
    this.listScope = scope;
  }

  setCreatedWithin(value: CreatedWithin): void {
    this.createdWithin = value;
  }

  toggleFilter(key: 'aiDecision' | 'category' | 'priority' | 'receiveMethod', value: string): void {
    const selectedValues = this.selectedFilters[key];
    const selectedIndex = selectedValues.indexOf(value);

    if (selectedIndex >= 0) {
      selectedValues.splice(selectedIndex, 1);
    } else {
      selectedValues.push(value);
    }
  }

  resetFilters(): void {
    this.selectedFilters = {
      aiDecision: [],
      category: [],
      priority: [],
      receiveMethod: [],
    };
    this.createdWithin = 'all';
    this.searchTerm = '';
  }

  private filterDonations(donations: RecipientDonationReview[]): RecipientDonationReview[] {
    const searchTerm = this.searchTerm.trim().toLocaleLowerCase();
    const oldest = this.createdWithinCutoff();

    return donations.filter((donation) => {
      if (searchTerm) {
        const haystack = [
          donation.demand_material,
          donation.actual_material,
          donation.donor_name,
          donation.demand_category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      if (oldest && new Date(donation.created_at).getTime() < oldest) {
        return false;
      }

      if (
        this.selectedFilters.aiDecision.length > 0 &&
        (!donation.ai_decision || !this.selectedFilters.aiDecision.includes(donation.ai_decision))
      ) {
        return false;
      }

      if (
        this.selectedFilters.category.length > 0 &&
        (!donation.demand_category || !this.selectedFilters.category.includes(donation.demand_category))
      ) {
        return false;
      }

      if (
        this.selectedFilters.priority.length > 0 &&
        (!donation.demand_priority || !this.selectedFilters.priority.includes(donation.demand_priority))
      ) {
        return false;
      }

      if (this.selectedFilters.receiveMethod.length > 0 && !this.selectedFilters.receiveMethod.includes(donation.donation_method)) {
        return false;
      }

      return true;
    });
  }

  private createdWithinCutoff(): number | null {
    if (this.createdWithin === 'all') {
      return null;
    }

    const days = this.createdWithin === '7d' ? 7 : this.createdWithin === '30d' ? 30 : 90;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }

  private pruneUnavailableFilters(): void {
    const categories = new Set(this.categoryOptions);
    const priorities = new Set(this.priorityOptions);
    const methods = new Set(this.receiveMethodOptions);

    this.selectedFilters.category = this.selectedFilters.category.filter((item) => categories.has(item));
    this.selectedFilters.priority = this.selectedFilters.priority.filter((item) => priorities.has(item));
    this.selectedFilters.receiveMethod = this.selectedFilters.receiveMethod.filter((item) => methods.has(item));
  }

  private uniqueSorted(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'zh-Hant'));
  }

  private isOpenStatus(status: RecipientDonationReview['status']): boolean {
    return status === 'pending_human_review' || status === 'pending_ai_review' || status === 'needs_supplement';
  }

  private isDoneStatus(status: RecipientDonationReview['status']): boolean {
    return status === 'human_approved' || status === 'human_rejected';
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

  statusLabel(donation: RecipientDonationReview): string {
    if (donation.status === 'pending_ai_review') {
      return 'AI 審核中';
    }

    if (donation.status === 'needs_supplement') {
      return '待捐助者補件';
    }

    if (donation.status === 'pending_human_review') {
      return '待機構決定';
    }

    if (donation.status === 'human_approved') {
      return '已接受';
    }

    if (donation.status === 'human_rejected') {
      return '未通過';
    }

    return '處理中';
  }

  openDonation(donation: RecipientDonationReview): void {
    void this.router.navigate(['/agency/item-review', donation.id]);
  }

  trackByDonationId(_index: number, donation: RecipientDonationReview): string {
    return donation.id;
  }
}
