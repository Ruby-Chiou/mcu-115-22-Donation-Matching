import { Injectable } from '@angular/core';
import { SupabaseService } from '../database/supabase.service';

export interface DailyComment {
  id: number;
  demand_id: number;
  user_id: string | null;
  user_role: 'donor' | 'agency';
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id: number | null;
  like_count: number;
  liked_user_ids: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DailyCommentService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 取得指定日常需求的所有留言
   */
  async getComments(demandId: number): Promise<DailyComment[]> {
    const { data, error } = await this.supabaseService.client
      .from('daily_comments')
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('取得日常留言失敗：', error);
      console.error('錯誤完整內容：', JSON.stringify(error, null, 2));
      throw error;
    }

    return data ?? [];
  }

  /**
   * 取得指定日常需求的留言數量
   */

  async getCommentCount(demandId: number): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('daily_comments')
      .select('*', { count: 'exact', head: true })
      .eq('demand_id', demandId)
      .is('parent_comment_id', null);

    if (error) {
      console.error('取得日常留言數量失敗：', error);
      return 0;
    }

    return count ?? 0;
  }

  /**
   * 新增一則日常需求留言或回覆
   */
  async addComment(
    demandId: number,
    userId: string | null,
    userRole: 'donor' | 'agency',
    userName: string,
    content: string,
    parentCommentId: number | null = null
  ): Promise<DailyComment> {
    // 顯示準備新增的留言資料，方便檢查 RLS 權限問題
    console.log('[日常留言] 新增資料：', {
      demand_id: demandId,
      user_id: userId,
      user_role: userRole,
      user_name: userName,
      content,
      parent_comment_id: parentCommentId,
    });

    const { data, error } = await this.supabaseService.client
      .from('daily_comments')
      .insert({
        demand_id: demandId,
        user_id: userId,
        user_role: userRole,
        user_name: userName,
        content,
        parent_comment_id: parentCommentId,
      })
      .select()
      .single();

    if (error) {
      console.error('新增日常留言失敗：', error);
      console.error('錯誤完整內容：', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  }

  /**
   * 按讚或收回留言愛心
   */

  async toggleLike(commentId: number, userId: string): Promise<DailyComment> {
    const { data, error } = await this.supabaseService.client.rpc('toggle_daily_comment_like', {
      p_comment_id: commentId,
      p_user_id: userId,
    });

    if (error) {
      console.error('更新日常留言愛心失敗：', error);
      throw error;
    }

    return data as DailyComment;
  }
}
