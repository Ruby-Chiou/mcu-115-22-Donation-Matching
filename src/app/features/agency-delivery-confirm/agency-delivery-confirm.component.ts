import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DeliveryConfirmationService } from '../../core/services/agency/delivery-confirmation.service';
import { DonationRecordLinksComponent } from '../agency-record-links/donation-record-links.component';
import { DeliveryShipment, ReceiptProofFile, receiptSubmitError } from '../../models/agency/delivery-confirmation';

@Component({
  selector: 'app-agency-delivery-confirm',
  imports: [DatePipe, DonationRecordLinksComponent],
  templateUrl: './agency-delivery-confirm.component.html',
  styleUrl: './agency-delivery-confirm.component.scss',
})
export class AgencyDeliveryConfirmComponent implements OnInit {
  private readonly deliveries = inject(DeliveryConfirmationService);
  private readonly changes = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected shipments: DeliveryShipment[] = [];
  protected selected: DeliveryShipment | null = null;
  protected proofs: ReceiptProofFile[] = [];
  protected photos: File[] = [];
  protected video: File | null = null;
  protected partial = false;
  protected declinedVideo = false;
  protected note = '';
  protected loadError = '';
  protected formError = '';
  protected missingId = '';
  protected loading = true;
  protected submitting = false;

  async ngOnInit(): Promise<void> {
    await this.reload();
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      return;
    }

    const shipment = this.shipments.find((item) => item.id === id);
    if (shipment) {
      await this.open(shipment, false);
      return;
    }

    this.missingId = id;
    this.changes.detectChanges();
  }

  protected waiting(): DeliveryShipment[] {
    return this.shipments.filter((shipment) => !shipment.receiptConfirmedAt);
  }

  protected ready(shipment: DeliveryShipment): boolean {
    return this.deliveries.readyToConfirm(shipment);
  }

  protected async open(shipment: DeliveryShipment, syncUrl = true): Promise<void> {
    this.selected = shipment;
    this.missingId = '';
    this.photos = [];
    this.video = null;
    this.partial = false;
    this.declinedVideo = false;
    this.note = '';
    this.formError = '';
    this.proofs = [];

    if (shipment.receiptConfirmedAt) {
      try {
        this.proofs = await this.deliveries.proofs(shipment.id);
      } catch (error) {
        this.formError = error instanceof Error ? error.message : '無法讀取簽收檔案。';
      }
    }

    this.changes.detectChanges();

    if (syncUrl && this.route.snapshot.queryParamMap.get('id') !== shipment.id) {
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: shipment.id },
        replaceUrl: true,
      });
    }
  }

  protected onPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.formError = '收貨證明請用照片。';
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        this.formError = '單張照片請小於 8MB。';
        return;
      }
    }

    this.photos = [...this.photos, ...files].slice(0, 8);
    this.formError = '';
  }

  protected onVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      this.formError = '請選擇影片檔。';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.formError = '影片請小於 50MB。';
      return;
    }

    this.video = file;
    this.declinedVideo = false;
    this.formError = '';
  }

  protected removePhoto(index: number): void {
    this.photos = this.photos.filter((_, current) => current !== index);
  }

  protected clearVideo(): void {
    this.video = null;
  }

  protected async submit(): Promise<void> {
    const shipment = this.selected;
    if (!shipment || this.submitting) {
      return;
    }

    const error = receiptSubmitError({
      donationMethod: shipment.donationMethod,
      trackingNo: shipment.trackingNo,
      alreadyConfirmed: !!shipment.receiptConfirmedAt,
      photoCount: this.photos.length,
      hasVideo: !!this.video,
      declinedVideo: this.declinedVideo,
    });

    this.formError = error ?? '';
    if (error) {
      return;
    }

    this.submitting = true;
    this.changes.detectChanges();

    try {
      await this.deliveries.submit({
        donationId: shipment.id,
        photos: this.photos,
        video: this.video,
        partial: this.partial,
        declinedVideo: this.declinedVideo,
        note: this.note,
      });
      await this.reload();
      const updated = this.shipments.find((item) => item.id === shipment.id) ?? null;
      if (updated) {
        await this.open(updated);
      }
    } catch (submitError) {
      this.formError = submitError instanceof Error ? submitError.message : '簽收回報失敗。';
    } finally {
      this.submitting = false;
      this.changes.detectChanges();
    }
  }

  private async reload(): Promise<void> {
    this.loading = true;
    try {
      this.shipments = await this.deliveries.list();
      this.loadError = '';
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : '無法載入待簽收的捐助。';
    } finally {
      this.loading = false;
      this.changes.detectChanges();
    }
  }
}
