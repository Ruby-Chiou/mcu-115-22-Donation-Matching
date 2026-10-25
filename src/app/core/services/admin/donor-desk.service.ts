import { Injectable, inject } from '@angular/core';

import { BoardName } from './board-announcement.service';
import { DonorAccountRecord } from './donor-account-admin.service';
import { DonorActivity, DonorActivityService } from './donor-activity.service';
import { DonorBoardService } from './donor-board.service';

export type { DonorActivity, DonorActivityItem, DonorActivityKind } from './donor-activity.service';

/** 管理端捐助者頁的入口。看板與活動紀錄各自一個服務，這裡只轉交。 */
@Injectable({
  providedIn: 'root',
})
export class DonorDeskService {
  private readonly board = inject(DonorBoardService);
  private readonly activityService = inject(DonorActivityService);

  maskName(donor: DonorAccountRecord): string {
    return this.board.maskName(donor);
  }

  boardMarks() {
    return this.board.boardMarks();
  }

  adminThank(donorUid: string) {
    return this.board.adminThank(donorUid);
  }

  boardEntry(donorUid: string, board: BoardName) {
    return this.board.boardEntry(donorUid, board);
  }

  publicDonorBlacklist() {
    return this.board.publicDonorBlacklist();
  }

  saveBoard(donor: DonorAccountRecord, board: BoardName, headline: string, body: string) {
    return this.board.saveBoard(donor, board, headline, body);
  }

  publishThankCard(donor: DonorAccountRecord, displayName: string, donationItem: string) {
    return this.board.publishThankCard(donor, displayName, donationItem);
  }

  clearBoard(donorUid: string, board: BoardName) {
    return this.board.clearBoard(donorUid, board);
  }

  sendMessage(donor: DonorAccountRecord, subject: string, content: string) {
    return this.activityService.sendMessage(donor, subject, content);
  }

  repairDonation(id: string, fields: Record<string, string>) {
    return this.activityService.repairDonation(id, fields);
  }

  repairThank(id: string, fields: Record<string, string>) {
    return this.activityService.repairThank(id, fields);
  }

  repairReceipt(id: string, fields: Record<string, string>) {
    return this.activityService.repairReceipt(id, fields);
  }

  repairCertificate(id: string, fields: Record<string, string>) {
    return this.activityService.repairCertificate(id, fields);
  }

  activity(donorUid: string): Promise<DonorActivity> {
    return this.activityService.activity(donorUid);
  }
}
