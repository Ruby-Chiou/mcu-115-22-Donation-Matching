import {
  AgencyApplication,
  ReviewStatus,
} from '../../../core/services/agency-verification/agency-verification.service';

export type AgencyListFilter = 'all' | ReviewStatus | 'deleted';

export class AgencyApplicationQuery {
  filter(applications: readonly AgencyApplication[], keyword: string, status: AgencyListFilter): AgencyApplication[] {
    const normalized = keyword.trim().toLowerCase();

    return applications.filter(
      (application) => this.matchesKeyword(application, normalized) && this.matchesStatus(application, status),
    );
  }

  count(applications: readonly AgencyApplication[], status: ReviewStatus): number {
    return applications.filter(
      (application) => application.accountStatus !== 'DELETED' && application.status === status,
    ).length;
  }

  private matchesKeyword(application: AgencyApplication, keyword: string): boolean {
    if (!keyword) {
      return true;
    }

    return [
      application.name,
      application.contact,
      application.phone,
      application.email,
      application.registrationNumber,
    ].some((value) => value.toLowerCase().includes(keyword));
  }

  private matchesStatus(application: AgencyApplication, status: AgencyListFilter): boolean {
    if (status === 'all') {
      return true;
    }

    if (status === 'deleted') {
      return application.accountStatus === 'DELETED';
    }

    return application.accountStatus !== 'DELETED' && application.status === status;
  }
}
