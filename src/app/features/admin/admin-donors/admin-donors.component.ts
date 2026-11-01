import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DonorAccountAdminService, DonorAccountRecord, DonorAdminStatus } from '../../../core/services/admin/donor-account-admin.service';
import { DonorDeskService } from '../../../core/services/admin/donor-desk.service';
import { DONOR_LOGIN_PROVIDER_LABELS, DonorLoginProvider } from '../../../models/user/donor';

@Component({
  selector: 'app-admin-donors',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-donors.component.html',
  styleUrl: './admin-donors.component.scss',
})
export class AdminDonorsComponent implements OnInit {
  private readonly accounts = inject(DonorAccountAdminService);
  private readonly desk = inject(DonorDeskService);

  protected readonly loading = signal(true);
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected readonly donors = signal<DonorAccountRecord[]>([]);
  protected readonly marks = signal(new Map<string, { thank: boolean; blacklist: boolean }>());
  protected keyword = '';
  protected statusFilter: 'all' | DonorAdminStatus = 'all';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected visible(): DonorAccountRecord[] {
    const keyword = this.keyword.trim().toLowerCase();
    return this.donors().filter((donor) => {
      const statusMatches = this.statusFilter === 'all' || donor.accountStatus === this.statusFilter;
      const text = `${donor.displayName} ${donor.fullName} ${donor.email}`.toLowerCase();
      return statusMatches && (!keyword || text.includes(keyword));
    });
  }

  protected statusLabel(status: DonorAdminStatus): string {
    if (status === 'SUSPENDED') {
      return '已停用';
    }
    if (status === 'DELETED') {
      return '已註銷';
    }
    return '使用中';
  }

  protected isSocialLogin(donor: DonorAccountRecord): boolean {
    const provider = (donor.loginProvider || '').toLowerCase();
    return provider === 'google' || provider === 'line' || provider === 'facebook' || (!donor.email && provider !== 'email');
  }

  protected providerLabel(donor: DonorAccountRecord): string {
    const raw = (donor.loginProvider || '').toLowerCase();
    if (raw === 'google' || raw === 'line' || raw === 'facebook' || raw === 'email') {
      const label = DONOR_LOGIN_PROVIDER_LABELS[raw as DonorLoginProvider];
      return !donor.email && raw !== 'email' ? `${label}（未綁定信箱）` : label;
    }
    return donor.email ? 'Email 帳號' : '第三方登入（未標示來源）';
  }

  protected mark(uid: string): { thank: boolean; blacklist: boolean } {
    return this.marks().get(uid) ?? { thank: false, blacklist: false };
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const [donors, marks] = await Promise.all([this.accounts.list(), this.desk.boardMarks()]);
      this.donors.set(donors);
      this.marks.set(marks);
      this.noticeError.set(false);
    } catch (error) {
      console.error(error);
      this.notice.set('捐助者帳號讀取失敗。');
      this.noticeError.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
