import { SupabaseService } from '../database/supabase.service';

export interface CommentRecord {
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

export interface NewComment {
  demandId: number;
  userId: string | null;
  userRole: 'donor' | 'agency';
  userName: string;
  content: string;
  parentCommentId: number | null;
}

export interface CommentStore {
  getComments(demandId: number): Promise<CommentRecord[]>;
  getCommentCount(demandId: number): Promise<number>;
  addComment(
    demandId: number,
    userId: string | null,
    userRole: 'donor' | 'agency',
    userName: string,
    content: string,
    parentCommentId?: number | null
  ): Promise<CommentRecord>;
  toggleLike(commentId: number, userId: string): Promise<CommentRecord>;
}

type LikeMode = { kind: 'rpc'; rpc: string } | { kind: 'row' };

/** 同一套留言流程，只差資料表與按讚方式。 */
export class CommentTableStore implements CommentStore {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly table: string,
    private readonly likeMode: LikeMode,
    private readonly label: string
  ) {}

  async getComments(demandId: number): Promise<CommentRecord[]> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`取得${this.label}留言失敗：`, error);
      throw error;
    }

    return (data ?? []) as CommentRecord[];
  }

  async getCommentCount(demandId: number): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('demand_id', demandId)
      .is('parent_comment_id', null);

    if (error) {
      console.error(`取得${this.label}留言數量失敗：`, error);
      return 0;
    }

    return count ?? 0;
  }

  async addComment(
    demandId: number,
    userId: string | null,
    userRole: 'donor' | 'agency',
    userName: string,
    content: string,
    parentCommentId: number | null = null
  ): Promise<CommentRecord> {
    const { data, error } = await this.supabase.client
      .from(this.table)
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
      console.error(`新增${this.label}留言失敗：`, error);
      throw error;
    }

    return data as CommentRecord;
  }

  async toggleLike(commentId: number, userId: string): Promise<CommentRecord> {
    if (this.likeMode.kind === 'rpc') {
      const { data, error } = await this.supabase.client.rpc(this.likeMode.rpc, {
        p_comment_id: commentId,
        p_user_id: userId,
      });

      if (error) {
        console.error(`更新${this.label}留言愛心失敗：`, error);
        throw error;
      }

      return data as CommentRecord;
    }

    const { data: comment, error: fetchError } = await this.supabase.client.from(this.table).select('*').eq('id', commentId).single();

    if (fetchError) {
      console.error(`取得${this.label}留言愛心資料失敗：`, fetchError);
      throw fetchError;
    }

    const likedUserIds: string[] = comment.liked_user_ids ?? [];
    const alreadyLiked = likedUserIds.includes(userId);
    const newLikedUserIds = alreadyLiked ? likedUserIds.filter((id) => id !== userId) : [...likedUserIds, userId];
    const newLikeCount = alreadyLiked ? Math.max(0, (comment.like_count ?? 0) - 1) : (comment.like_count ?? 0) + 1;

    const { data, error } = await this.supabase.client
      .from(this.table)
      .update({
        like_count: newLikeCount,
        liked_user_ids: newLikedUserIds,
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error(`更新${this.label}留言愛心失敗：`, error);
      throw error;
    }

    return data as CommentRecord;
  }
}
