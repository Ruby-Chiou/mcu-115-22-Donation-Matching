import { Injectable } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { CommentRecord, CommentTableStore } from './comment-store';

export type HelperComment = CommentRecord;

@Injectable({
  providedIn: 'root',
})
export class HelperCommentService extends CommentTableStore {
  constructor(supabase: SupabaseService) {
    super(supabase, 'volunteer_comments', { kind: 'row' }, '協力者');
  }
}
