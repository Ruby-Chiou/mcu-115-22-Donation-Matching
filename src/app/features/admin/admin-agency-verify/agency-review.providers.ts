import { AgencyVerificationService } from '../../../core/services/agency-verification/agency-verification.service';

import {
  AGENCY_APPLICATION_READER,
  AGENCY_DOCUMENT_READER,
  AGENCY_REVIEW_WRITER,
} from '../../../core/services/agency-verification/agency-review.ports';

export function provideAgencyReviewPorts() {
  return [
    { provide: AGENCY_APPLICATION_READER, useExisting: AgencyVerificationService },
    { provide: AGENCY_REVIEW_WRITER, useExisting: AgencyVerificationService },
    { provide: AGENCY_DOCUMENT_READER, useExisting: AgencyVerificationService },
  ];
}
