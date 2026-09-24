export type InspectionDecision =
  | 'rejected'
  | 'human_review';

export interface InspectionResult {
  decision: InspectionDecision;
  decisionText: string;
  detectedCondition: string;
  detectedConditionText: string;
  reason: string;
}
