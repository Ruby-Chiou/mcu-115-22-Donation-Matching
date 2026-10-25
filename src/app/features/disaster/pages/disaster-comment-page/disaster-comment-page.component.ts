import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DisasterCommentService } from '../../../../core/services/comments/disaster-comment.service';
import { DisasterComment } from '../../../../core/services/comments/disaster-comment.service';
import { CommentAuthorChipComponent } from '../../../../components/comment/comment-author-chip.component';
import { commentAuthor, commentWriteError, withCommentPreviews } from '../../../../components/comment/comment-author.data';
import { AuthSessionService } from '../../../../core/services/auth/auth-session.service';

interface CommentThreadNode {
  comment: DisasterComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-disaster-comment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentAuthorChipComponent],
  templateUrl: './disaster-comment-page.component.html',
  styleUrl: './disaster-comment-page.component.scss',
})
export class DisasterCommentPageComponent implements OnInit {
  private readonly currentUserId = '00000000-0000-0000-0000-000000000002';
  private readonly auth = inject(AuthSessionService);
  commentNotice = '';
  private readonly likingCommentIds = new Set<number>();

  demandId = 0;

  isLoading = true;
  loadError = '';

  comments: DisasterComment[] = [];

  commentThreads: CommentThreadNode[] = [];

  newComment = '';

  replyingTo: DisasterComment | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly disasterCommentService: DisasterCommentService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    console.log('[災害留言頁] route id：', rawId);

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[災害留言頁] 無效的需求 id：', id);

      this.loadError = '網址中的災害需求編號不正確。';
      this.isLoading = false;

      return;
    }

    this.demandId = id;

    await this.loadComments();

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async loadComments(): Promise<void> {
    try {
      console.log('[災害留言頁] 開始載入留言，demand_id：', this.demandId);

      this.comments = await this.disasterCommentService.getComments(this.demandId);

      console.log('[災害留言頁] 留言資料：', this.comments);

      this.buildCommentThreads();
    } catch (error) {
      console.error('[災害留言頁] 載入留言失敗：', error);

      this.comments = [];
      this.commentNotice = '真實留言暫時讀不到，下面仍是示範的一問一答。';
      this.buildCommentThreads();
    }
  }

  buildCommentThreads(): void {
    const comments = withCommentPreviews(this.comments, this.demandId);
    const nodeMap = new Map<number, CommentThreadNode>();

    // 先將每一則留言建立成節點
    comments.forEach((comment) => {
      nodeMap.set(comment.id, {
        comment,
        replies: [],
        showAllReplies: false,
      });
    });

    const parentComments: CommentThreadNode[] = [];

    // 再依照 parent_comment_id 建立留言關係
    comments.forEach((comment) => {
      const node = nodeMap.get(comment.id);

      if (!node) {
        return;
      }

      if (comment.parent_comment_id === null) {
        parentComments.push(node);
        return;
      }

      const parentNode = nodeMap.get(comment.parent_comment_id);

      if (parentNode) {
        parentNode.replies.push(node);
      }
    });

    // 每一層回覆都依照時間排序
    const sortReplies = (nodes: CommentThreadNode[]): void => {
      nodes.sort((a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime());

      nodes.forEach((node) => sortReplies(node.replies));
    };

    sortReplies(parentComments);

    this.commentThreads = parentComments;
  }

  replyTo(comment: DisasterComment): void {
    this.replyingTo = comment;
    this.newComment = '';
    this.cdr.detectChanges();
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.newComment = '';
    this.cdr.detectChanges();
  }

  async addComment(): Promise<void> {
    const content = this.newComment.trim();

    this.commentNotice = '';

    if (!content) {
      this.commentNotice = '請先輸入留言內容。';
      this.cdr.detectChanges();
      return;
    }

    if (!this.demandId) {
      this.commentNotice = '找不到這筆需求，留言沒有送出。';
      this.cdr.detectChanges();
      return;
    }

    const author = commentAuthor(this.auth.principal(), 'agency');
    const parentId = this.replyingTo?.id ?? null;

    if (parentId !== null && parentId < 0) {
      this.comments = [
        {
          id: -Date.now(),
          demand_id: this.demandId,
          user_id: author.userId,
          user_role: author.role,
          user_name: author.name,
          content,
          created_at: new Date().toISOString(),
          parent_comment_id: parentId,
          like_count: 0,
          liked_user_ids: [],
        },
        ...this.comments,
      ];
      this.newComment = '';
      this.replyingTo = null;
      this.buildCommentThreads();
      this.cdr.detectChanges();
      return;
    }

    try {
      const newComment = await this.disasterCommentService.addComment(
        this.demandId,
        author.userId,
        author.role,
        author.name,
        content,
        parentId,
      );

      this.comments = [newComment, ...this.comments];
      this.buildCommentThreads();

      this.newComment = '';
      this.replyingTo = null;

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言頁] 新增留言失敗：', error);
      this.commentNotice = commentWriteError(error);
      this.cdr.detectChanges();
    }
  }

  hasLiked(comment: DisasterComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  async toggleLike(comment: DisasterComment): Promise<void> {
    // 避免同一則留言在儲存期間重複送出
    if (this.likingCommentIds.has(comment.id)) {
      return;
    }

    this.likingCommentIds.add(comment.id);

    // 先記錄原本狀態，失敗時才能還原
    const originalLikeCount = comment.like_count;
    const originalLikedUserIds = [...(comment.liked_user_ids ?? [])];

    const alreadyLiked = originalLikedUserIds.includes(this.currentUserId);

    // 立即更新畫面
    if (alreadyLiked) {
      comment.like_count = Math.max(0, (comment.like_count ?? 0) - 1);
      comment.liked_user_ids = originalLikedUserIds.filter((id) => id !== this.currentUserId);
    } else {
      comment.like_count = (comment.like_count ?? 0) + 1;
      comment.liked_user_ids = [...originalLikedUserIds, this.currentUserId];
    }

    this.cdr.detectChanges();

    try {
      // 背景同步儲存到資料庫
      const updatedComment = await this.disasterCommentService.toggleLike(comment.id, this.currentUserId);

      // 以資料庫回傳的結果確認最終狀態
      const index = this.comments.findIndex((item) => item.id === comment.id);

      if (index !== -1) {
        this.comments[index] = {
          ...this.comments[index],
          like_count: updatedComment.like_count,
          liked_user_ids: updatedComment.liked_user_ids,
        };

        comment.like_count = updatedComment.like_count;
        comment.liked_user_ids = updatedComment.liked_user_ids;
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言頁] 愛心操作失敗：', error);

      // 儲存失敗，還原畫面
      comment.like_count = originalLikeCount;
      comment.liked_user_ids = originalLikedUserIds;

      this.cdr.detectChanges();
    } finally {
      this.likingCommentIds.delete(comment.id);
    }
  }

  getReplyTargetName(parentCommentId: number): string {
    const parentComment = withCommentPreviews(this.comments, this.demandId).find((comment) => comment.id === parentCommentId);

    return parentComment?.user_name ?? '原留言者';
  }

  formatCommentDate(date: string): string {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  toggleReplies(thread: CommentThreadNode): void {
    thread.showAllReplies = !thread.showAllReplies;
    this.cdr.detectChanges();
  }

  countReplies(thread: CommentThreadNode): number {
    return thread.replies.reduce((count, reply) => count + 1 + this.countReplies(reply), 0);
  }

  goBack(): void {
    this.router.navigate(['/agency/disaster']);
  }
}
