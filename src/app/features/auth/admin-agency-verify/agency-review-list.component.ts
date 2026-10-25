import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AgencyApplication } from '../../../core/services/agency-verification/agency-verification.service';
import { AgencyListFilter } from './agency-application-query';
import { agencyStatusClass, agencyStatusText } from './agency-review-status';

@Component({
  selector: 'app-agency-review-list',
  imports: [FormsModule],
  templateUrl: './agency-review-list.component.html',
  styleUrl: './agency-review-list.component.scss',
})
export class AgencyReviewListComponent {
  readonly applications = input.required<AgencyApplication[]>();
  readonly keyword = model('');
  readonly status = model<AgencyListFilter>('all');
  readonly cancellingId = input('');
  readonly openApplication = output<AgencyApplication>();
  readonly cancelAccount = output<{ application: AgencyApplication; note: string }>();

  protected statusText(application: AgencyApplication): string {
    return agencyStatusText(application);
  }

  protected statusClass(application: AgencyApplication): string {
    return agencyStatusClass(application);
  }

  protected clearFilters(): void {
    this.keyword.set('');
    this.status.set('all');
  }

  protected requestCancel(application: AgencyApplication): void {
    if (application.accountStatus === 'DELETED' || this.cancellingId() === application.id) {
      return;
    }

    const note = window.prompt(`請填寫註銷「${application.name}」的原因`);
    if (!note?.trim()) {
      return;
    }

    const confirmed = window.confirm(`確定註銷「${application.name}」？註銷後不能再登入，民眾頁也不再顯示這個機構。`);
    if (!confirmed) {
      return;
    }

    this.cancelAccount.emit({ application, note: note.trim() });
  }
}
