import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DailyCommentService } from '../../../core/services/comments/daily-comment.service';
import { DailyComment } from '../../../core/services/comments/daily-comment.service';
import { CommentAuthorChipComponent } from '../../comment/comment-author-chip.component';
import { commentAuthor, commentWriteError, withCommentPreviews } from '../../comment/comment-author.data';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';

interface CommentThreadNode {
  comment: DailyComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-daily-comment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentAuthorChipComponent],
  templateUrl: './daily-comment-page.component.html',
  styleUrl: './daily-comment-page.component.scss',
})
export class DailyCommentPageComponent implements OnInit {
  private readonly currentUserId = '00000000-0000-0000-0000-000000000002';
  private readonly auth = inject(AuthSessionService);
  commentNotice = '';

  demandId = 0;

  isLoading = true;
  loadError = '';

  comments: DailyComment[] = [];

  commentThreads: CommentThreadNode[] = [];

  newComment = '';

  replyingTo: DailyComment | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dailyCommentService: DailyCommentService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    console.log('[日常留言頁] route id：', rawId);

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[日常留言頁] 無效的需求 id：', id);

      this.loadError = '網址中的日常需求編號不正確。';
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
      console.log('[日常留言頁] 開始載入留言，demand_id：', this.demandId);

      this.comments = await this.dailyCommentService.getComments(this.demandId);

      console.log('[日常留言頁] 留言資料：', this.comments);

      this.buildCommentThreads();
    } catch (error) {
      console.error('[日常留言頁] 載入留言失敗：', error);

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

  replyTo(comment: DailyComment): void {
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
        ...this.comments,
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
      ];
      this.newComment = '';
      this.replyingTo = null;
      this.buildCommentThreads();
      this.cdr.detectChanges();
      return;
    }

    try {
      const newComment = await this.dailyCommentService.addComment(
        this.demandId,
        author.userId,
        author.role,
        author.name,
        content,
        parentId,
      );

      this.comments = [...this.comments, newComment];
      this.buildCommentThreads();

      this.newComment = '';
      this.replyingTo = null;

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[日常留言頁] 新增留言失敗：', error);
      this.commentNotice = commentWriteError(error);
      this.cdr.detectChanges();
    }
  }

  hasLiked(comment: DailyComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  async toggleLike(comment: DailyComment): Promise<void> {
    try {
      const updatedComment = await this.dailyCommentService.toggleLike(comment.id, this.currentUserId);

      const index = this.comments.findIndex((item) => item.id === comment.id);

      if (index !== -1) {
        this.comments[index] = updatedComment;

        // 只更新留言資料，不重建留言樹
        comment.like_count = updatedComment.like_count;
        comment.liked_user_ids = updatedComment.liked_user_ids;
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[日常留言頁] 愛心操作失敗：', error);
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
    this.router.navigate(['/agency/daily']);
  }
}
