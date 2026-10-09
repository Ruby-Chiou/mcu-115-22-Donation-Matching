import { Injectable } from '@angular/core';
import { SupabaseService } from '../database/supabase.service';

export interface DisasterComment {
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
export class DisasterCommentService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 取得指定災害需求的所有留言
   */
  async getComments(demandId: number): Promise<DisasterComment[]> {
    const { data, error } = await this.supabaseService.client
      .from('disaster_comments')
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('取得災害留言失敗：', error);
      console.error('錯誤完整內容：', JSON.stringify(error, null, 2));
      throw error;
    }

    // 暫時檢查資料庫回傳的留言及父留言關係
    console.table(
      (data ?? []).map((comment) => ({
        id: comment.id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
      }))
    );

    return data ?? [];
  }

  /**
   * 取得指定災害需求的留言數量
   */
  async getCommentCount(demandId: number): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from('disaster_comments')
      .select('*', { count: 'exact', head: true })
      .eq('demand_id', demandId)
      .is('parent_comment_id', null);

    if (error) {
      console.error('取得留言數量失敗：', error);
      return 0;
    }

    return count ?? 0;
  }

  /**
   * 新增一則災害需求留言
   */
  async addComment(
    demandId: number,
    userId: string | null,
    userRole: 'donor' | 'agency',
    userName: string,
    content: string,
    parentCommentId: number | null = null
  ): Promise<DisasterComment> {
    const { data, error } = await this.supabaseService.client
      .from('disaster_comments')
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
      console.error('新增災害留言失敗：', error);
      console.error('錯誤完整內容：', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  }

  async toggleLike(commentId: number, userId: string): Promise<DisasterComment> {
    // 先取得目前留言
    const { data: comment, error: fetchError } = await this.supabaseService.client
      .from('disaster_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('取得留言愛心資料失敗：', fetchError);
      throw fetchError;
    }

    const likedUserIds: string[] = comment.liked_user_ids ?? [];

    const alreadyLiked = likedUserIds.includes(userId);

    let newLikedUserIds: string[];
    let newLikeCount: number;

    if (alreadyLiked) {
      // 已經按過 → 收回愛心
      newLikedUserIds = likedUserIds.filter((id) => id !== userId);
      newLikeCount = Math.max(0, (comment.like_count ?? 0) - 1);
    } else {
      // 尚未按過 → 增加愛心
      newLikedUserIds = [...likedUserIds, userId];
      newLikeCount = (comment.like_count ?? 0) + 1;
    }

    const { data, error } = await this.supabaseService.client
      .from('disaster_comments')
      .update({
        like_count: newLikeCount,
        liked_user_ids: newLikedUserIds,
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('更新留言愛心失敗：', error);
      throw error;
    }

    return data;
  }
}
