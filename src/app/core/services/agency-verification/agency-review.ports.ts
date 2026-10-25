import { InjectionToken } from '@angular/core';

import type { AgencyApplication, AgencyVerificationFile, ReviewStatus } from './agency-verification.service';

export interface AgencyApplicationReader {
  list(): Promise<AgencyApplication[]>;
}

export interface AgencyReviewWriter {
  updateStatus(id: string, status: Exclude<ReviewStatus, 'pending'>, reviewNote: string): Promise<boolean>;
  cancelAccount(id: string, reviewNote: string): Promise<boolean>;
}

export interface AgencyDocumentReader {
  readFile(uid: string): Promise<AgencyVerificationFile>;
}

export const AGENCY_APPLICATION_READER = new InjectionToken<AgencyApplicationReader>('AgencyApplicationReader');

export const AGENCY_REVIEW_WRITER = new InjectionToken<AgencyReviewWriter>('AgencyReviewWriter');

export const AGENCY_DOCUMENT_READER = new InjectionToken<AgencyDocumentReader>('AgencyDocumentReader');
