import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SupportComplaint, SupportComplaintService } from '../../core/services/admin/support-complaint.service';
import { AgencyAccessGrant, AgencyAccessService } from '../../core/services/agency/agency-access.service';
import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import { AgencyApplication, AgencyVerificationService } from '../../core/services/agency-verification/agency-verification.service';
import { CompanyApplication, CompanyVerificationService } from '../../core/services/auth/company-verification.service';
import { DisasterControlService } from '../../core/services/disaster-control/disaster-control.service';
import { BeneficiaryPublicProfile } from '../../models/agency/beneficiary-public-profile';

type DeskMode = 'overview' | 'donor' | 'agency';

interface DeskPage {
  name: string;
  desc: string;
  path: string | null;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly complaintsApi = inject(SupportComplaintService);
  private readonly agenciesApi = inject(AgencyVerificationService);
  private readonly companiesApi = inject(CompanyVerificationService);
  private readonly profilesApi = inject(BeneficiaryPublicProfileService);
  private readonly accessApi = inject(AgencyAccessService);
  private readonly disaster = inject(DisasterControlService);

  protected readonly mode = signal<DeskMode>('overview');
  protected readonly loading = signal(true);
  protected readonly notice = signal('');
  protected readonly openComplaints = signal<SupportComplaint[]>([]);
  protected readonly pendingAgencies = signal<AgencyApplication[]>([]);
  protected readonly pendingCompanies = signal<CompanyApplication[]>([]);
  protected readonly profiles = signal<BeneficiaryPublicProfile[]>([]);
  protected readonly agencyUids = signal(new Map<string, string>());
  protected readonly accessGrant = signal<AgencyAccessGrant | null>(null);
  protected readonly selectedName = signal('');
  protected readonly accessBusy = signal(false);
  protected readonly accessNotice = signal('');
  protected readonly accessOk = signal(false);
  protected readonly leaveNotice = this.accessApi.leaveNotice;
  private readonly accessAlert = viewChild<ElementRef<HTMLElement>>('accessAlert');
  protected agencyQuery = '';
  protected accessReason = '';
  protected operatorName = '';
  protected operatorPassword = '';
  private timer = 0;
  private readonly refreshGrant = (): void => {
    if (!document.hidden && !this.accessBusy()) {
      void this.pullGrant();
    }
  };

  async ngOnInit(): Promise<void> {
    this.timer = window.setInterval(this.refreshGrant, 4000);
    window.addEventListener('focus', this.refreshGrant);
    await this.load();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
    window.removeEventListener('focus', this.refreshGrant);
  }

  protected get disasterOpen(): boolean {
    return this.disaster.data().isOpen;
  }

  protected show(next: DeskMode): void {
    this.mode.set(next);
  }

  protected visibleAgencies(): BeneficiaryPublicProfile[] {
    const keyword = this.agencyQuery.trim().toLowerCase();
    return this.profiles().filter((profile) => {
      const text = `${profile.organizationName} ${profile.city}`.toLowerCase();
      return !keyword || text.includes(keyword);
    });
  }

  protected selectedAgency(): BeneficiaryPublicProfile | null {
    const name = this.selectedName();
    return this.profiles().find((profile) => profile.organizationName === name) ?? this.visibleAgencies()[0] ?? null;
  }

  protected choose(profile: BeneficiaryPublicProfile): void {
    this.selectedName.set(profile.organizationName);
    this.accessNotice.set('');
  }

  protected mark(name: string): string {
    return name.trim().slice(0, 1) || '機';
  }

  protected donorPages(): DeskPage[] {
    const pages: DeskPage[] = [
      { name: '日常捐助', desc: '捐助者瀏覽日常物資的大廳', path: '/donor/daily' },
      { name: '捐助地圖', desc: '附近可捐助的受助機構', path: '/daily/locations' },
      { name: '受助機構', desc: '公開的受助者介紹', path: '/donor/beneficiaries' },
      { name: '捐助感謝', desc: '公開感謝牆', path: '/thank-you-wall' },
      { name: '常見問題', desc: '客服中心', path: '/customer-service/faq' },
      { name: 'AI 客服', desc: '捐助者可以問的客服', path: '/customer-service/ai-chat' },
      { name: '聯絡我們', desc: '客訴會進管理者的客訴信箱', path: '/contact-us' },
      { name: '平台介紹', desc: '關於我們', path: '/intro' },
      { name: '平台導覽', desc: '給捐助者看的使用說明', path: '/platform-guide' },
    ];

    if (this.disasterOpen) {
      pages.splice(1, 0, { name: '災害救助', desc: '目前前台有開啟', path: '/donor/disaster' });
      pages.splice(2, 0, { name: '災害歷史紀錄', desc: '目前前台有開啟', path: '/disaster/history' });
    }

    return pages;
  }

  protected agencyChannels(profile: BeneficiaryPublicProfile): { title: string; items: DeskPage[] }[] {
    const front: DeskPage[] = [
      {
        name: '這家的公開介紹',
        desc: '捐助者點進這家受助者時看到的頁面',
        path: `/donor/beneficiaries/${profile.organizationName}`,
      },
      { name: '受助機構列表', desc: '和其他受助者排在一起', path: '/donor/beneficiaries' },
      { name: '捐助地圖', desc: '地圖上找得到這家', path: '/daily/locations' },
      { name: '日常捐助', desc: '捐助者看到的日常物資', path: '/donor/daily' },
      { name: '捐助感謝', desc: '公開感謝牆', path: '/thank-you-wall' },
    ];

    if (this.disasterOpen) {
      front.push({ name: '災害救助', desc: '目前前台有開啟', path: '/donor/disaster' });
    }

    const open = this.accessState(profile) === 'approved';
    const work: DeskPage[] = [
      { name: '機構總控制台', desc: '這家的作業首頁', path: open ? '/agency/dashboard' : null },
      { name: '機構資料', desc: '這家的公開介紹與聯絡資料', path: open ? '/agency/profile' : null },
      { name: '日常需求', desc: '發布與管理日常物資需求', path: open ? '/agency/daily' : null },
      { name: '物資審核', desc: '審核捐助者送出的物資', path: open ? '/agency/item-review' : null },
      { name: '收件確認', desc: '確認物資送到', path: open ? '/agency/delivery-confirm' : null },
      { name: '收據與感謝', desc: '開立收據、寄出感謝狀', path: open ? '/agency/receipt-review' : null },
    ];

    if (this.disasterOpen) {
      work.push({ name: '急難救助', desc: '管理這家的災害需求', path: open ? '/agency/disaster' : null });
    }

    return [
      { title: '捐助者也看得到', items: front },
      { title: open ? '這家已同意，可以操作' : '要這家同意後才能操作', items: work },
      {
        title: '客服與介紹',
        items: [
          { name: '常見問題', desc: '受助者導覽列也有', path: '/customer-service/faq' },
          { name: 'AI 客服', desc: '受助者導覽列也有', path: '/customer-service/ai-chat' },
          { name: '聯絡我們', desc: '寫信會進客訴信箱', path: '/contact-us' },
          { name: '平台介紹', desc: '關於我們', path: '/intro' },
          { name: '平台導覽', desc: '受助者使用說明', path: '/platform-guide' },
        ],
      },
    ];
  }

  protected accessState(profile: BeneficiaryPublicProfile): 'approved' | 'pending' | 'other' | 'none' {
    const uid = this.agencyUids().get(profile.organizationName);
    const grant = this.accessGrant();
    if (!grant || !uid) {
      return 'none';
    }
    if (grant.agencyUid !== uid) {
      return grant.status === 'approved' && this.accessApi.stillOpen(grant) ? 'other' : 'none';
    }
    if (grant.status === 'approved' && this.accessApi.stillOpen(grant)) {
      return 'approved';
    }
    return grant.status === 'pending' ? 'pending' : 'none';
  }

  protected async askAccess(profile: BeneficiaryPublicProfile): Promise<void> {
    const uid = this.agencyUids().get(profile.organizationName);
    if (!uid || this.accessBusy()) {
      this.showAccess(uid ? '' : '這家還沒有對應的受助者帳號。');
      return;
    }
    const operatorName = this.operatorName.trim();
    if (!operatorName || operatorName.length > 30 || this.operatorPassword.trim().length < 4) {
      this.showAccess('請填寫維修人員，並輸入密碼。');
      return;
    }

    this.accessBusy.set(true);
    this.accessNotice.set('');
    try {
      const grant = await this.accessApi.request(uid, this.accessReason, operatorName, this.operatorPassword);
      this.accessGrant.set(grant);
      this.accessReason = '';
      this.operatorPassword = '';
      this.accessApi.leaveNotice.set('');
    } catch (error) {
      this.showAccess(error instanceof Error ? error.message : '申請沒有送出。');
    } finally {
      this.accessBusy.set(false);
    }
  }

  protected async endAccess(): Promise<void> {
    const grant = this.accessGrant();
    if (!grant || this.accessBusy()) {
      return;
    }

    this.accessBusy.set(true);
    try {
      await this.accessApi.revoke(grant.id);
      this.accessGrant.set(null);
      this.showAccess('已結束這次接入。', true);
    } catch (error) {
      this.showAccess(error instanceof Error ? error.message : '沒有結束。');
    } finally {
      this.accessBusy.set(false);
    }
  }

  private showAccess(text: string, ok = false): void {
    this.accessOk.set(ok);
    this.accessNotice.set(text);
    setTimeout(() => this.accessAlert()?.nativeElement.scrollIntoView({ block: 'center' }), 0);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const [complaints, agencies, companies, profiles] = await Promise.allSettled([
      this.complaintsApi.list(),
      this.agenciesApi.list(),
      this.companiesApi.list(),
      this.profilesApi.ensureLoaded().then(() => this.profilesApi.list()),
    ]);

    if (complaints.status === 'fulfilled') {
      this.openComplaints.set(complaints.value.filter((item) => item.status === 'open'));
    }
    if (agencies.status === 'fulfilled') {
      this.pendingAgencies.set(
        agencies.value.filter((item) => item.status === 'pending' && item.accountStatus !== 'DELETED'),
      );
      this.agencyUids.set(new Map(agencies.value.map((item) => [item.name, item.id])));
    }
    await this.pullGrant();
    if (companies.status === 'fulfilled') {
      this.pendingCompanies.set(companies.value.filter((item) => item.status === 'pending'));
    }
    if (profiles.status === 'fulfilled') {
      this.profiles.set(profiles.value);
      if (!this.selectedName() && profiles.value[0]) {
        this.selectedName.set(profiles.value[0].organizationName);
      }
    }

    const failed = [complaints, agencies, companies, profiles].some((item) => item.status === 'rejected');
    this.notice.set(failed ? '有一部分概覽沒有讀到，已先顯示讀得到的內容。' : '');
    this.loading.set(false);
  }

  private async pullGrant(): Promise<void> {
    try {
      this.accessGrant.set(await this.accessApi.activeGrant(true));
    } catch (error) {
      console.error(error);
    }
  }
}
