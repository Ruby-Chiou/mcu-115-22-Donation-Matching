import { Injectable } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { CommentRecord, CommentTableStore } from './comment-store';

export type DisasterComment = CommentRecord;

@Injectable({
  providedIn: 'root',
})
export class DisasterCommentService extends CommentTableStore {
  constructor(supabase: SupabaseService) {
    super(supabase, 'disaster_comments', { kind: 'row' }, '災害');
  }
}
