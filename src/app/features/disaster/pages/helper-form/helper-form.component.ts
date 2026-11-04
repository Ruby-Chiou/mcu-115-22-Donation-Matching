import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelperDemand } from '../../../../models/agency/helper-demand';
import { LeaveUnsavedModalComponent } from '../../../../shared/ui/leave-unsaved-modal/leave-unsaved-modal.component';
import { HelperFormLogic } from '../../../../components/logic/disaster/helper-form.logic';
import { UiNoticeService } from '../../../../core/ui/ui-notice.service';
import { scrollToFirstMatching } from '../../../../core/ui/dom-scroll';

@Component({
  selector: 'app-helper-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LeaveUnsavedModalComponent],
  providers: [HelperFormLogic],
  templateUrl: './helper-form.component.html',
  styleUrls: ['./helper-form.component.scss'],
})
export class HelperFormComponent implements OnInit {
  private readonly logic = inject(HelperFormLogic);
  private readonly notices = inject(UiNoticeService);
  private readonly cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  isSaving = false;
  private originalLocation = '';
  showCancelModal = false;
  showSuccessModal = false;
  successMessage = '';
  editId: number | null = null;
  invalidFields: string[] = [];
  demand: HelperDemand = this.logic.createEmptyDemand();

  async ngOnInit(): Promise<void> {
    const parsed = this.logic.parseEditId();

    if (parsed.notice) {
      void this.notices.alert(parsed.notice);
      await this.logic.navigateAway();
      return;
    }

    if (!parsed.isEditMode || parsed.editId === null) {
      this.isEditMode = false;
      this.editId = null;
      return;
    }

    this.isEditMode = true;
    this.editId = parsed.editId;
    await this.loadEditDemand(parsed.editId);
  }

  private async loadEditDemand(id: number): Promise<void> {
    const result = await this.logic.loadEditDemand(id);

    if (!result.ok || !result.demand) {
      if (result.notice) {
        void this.notices.alert(result.notice);
      }
      await this.logic.navigateAway();
      return;
    }

    this.demand = result.demand;
    this.editId = this.demand.id;
    this.originalLocation = result.originalLocation ?? this.demand.location.trim();
    this.cdr.detectChanges();
  }

  limitPeopleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const people = this.logic.clampPeople(input.value);
    if (people === 500) {
      input.value = '500';
    }
    this.demand.people = people;
  }

  setPeople(value: string | number | null): void {
    this.demand.people = this.logic.clampPeople(value);
  }

  isInvalid(field: string): boolean {
    return this.logic.isFieldInvalid(this.demand, field as never, this.invalidFields);
  }

  async onPublish(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.invalidFields = [];
    this.isSaving = true;

    try {
      const result = await this.logic.save(this.demand, {
        isEditMode: this.isEditMode,
        originalLocation: this.originalLocation,
      });

      if (result.invalidFields?.length) {
        this.invalidFields = result.invalidFields;
        setTimeout(() => {
          const field = scrollToFirstMatching('.invalid-field');
          field?.focus();
        }, 0);
        return;
      }

      if (!result.ok) {
        if (result.notice) {
          void this.notices.alert(result.notice);
        }
        return;
      }

      if (result.demand) {
        this.demand = result.demand;
      }

      this.successMessage = result.successMessage ?? '儲存成功！';
      this.showSuccessModal = true;
      this.cdr.detectChanges();
    } finally {
      this.isSaving = false;
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.showCancelModal = true;
      return;
    }

    void this.logic.navigateAway();
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  confirmCancel(): void {
    this.showCancelModal = false;
    void this.logic.navigateAway();
  }

  async confirmSaveAndLeave(): Promise<void> {
    this.showCancelModal = false;
    await this.onPublish();
    if (this.showSuccessModal) {
      this.closeSuccessModal();
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    void this.logic.navigateAway();
  }
}
