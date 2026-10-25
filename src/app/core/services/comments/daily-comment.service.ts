import { Injectable } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { CommentRecord, CommentTableStore } from './comment-store';

export type DailyComment = CommentRecord;

@Injectable({
  providedIn: 'root',
})
export class DailyCommentService extends CommentTableStore {
  constructor(supabase: SupabaseService) {
    super(supabase, 'daily_comments', { kind: 'rpc', rpc: 'toggle_daily_comment_like' }, '日常');
  }
}
