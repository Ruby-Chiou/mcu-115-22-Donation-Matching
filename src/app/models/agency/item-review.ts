export type AiDecision = 'accepted' | 'rejected';

export type DonationStatus = 'pending_ai_review' | 'pending_human_review' | 'human_approved' | 'human_rejected';

export type DonationFileType = 'material_image' | 'material_video';

export interface RecipientDonationReview {
  id: string;
  demand_id: number;
  donor_name: string;
  phone: string;
  actual_material: string;
  quantity: number;
  note: string | null;
  donation_method: '寄送' | '面交';
  status: DonationStatus;
  ai_decision: AiDecision | null;
  ai_condition: string | null;
  ai_reason: string | null;
  ai_checked_at: string | null;
  human_decision: string | null;
  human_reason: string | null;
  human_checked_at: string | null;
  created_at: string;
  demand_material?: string;
}

export interface DonationFile {
  id: string;
  donation_id: string;
  file_type: 'material_image' | 'material_video' | 'proof';
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
  public_url?: string;
}
