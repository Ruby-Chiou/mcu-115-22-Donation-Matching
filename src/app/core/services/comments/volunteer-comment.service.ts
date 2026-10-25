import { Injectable } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { CommentRecord, CommentTableStore } from './comment-store';

export type VolunteerComment = CommentRecord;

@Injectable({
  providedIn: 'root',
})
export class VolunteerCommentService extends CommentTableStore {
  constructor(supabase: SupabaseService) {
    super(supabase, 'volunteer_comments', { kind: 'row' }, '志工');
  }
}
