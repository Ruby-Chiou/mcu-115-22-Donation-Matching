import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DisasterCommentService } from '../../../core/services/comments/disaster-comment.service';
import { DisasterComment } from '../../../core/services/comments/disaster-comment.service';

interface CommentThreadNode {
  comment: DisasterComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-disaster-comment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disaster-comment-page.component.html',
  styleUrl: './disaster-comment-page.component.scss',
})
export class DisasterCommentPageComponent implements OnInit {
  private readonly currentUserId = '00000000-0000-0000-0000-000000000002';

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

      this.loadError = '讀取留言失敗，請稍後再試。';
      this.comments = [];
      this.commentThreads = [];
    }
  }

  buildCommentThreads(): void {
    const nodeMap = new Map<number, CommentThreadNode>();

    // 先將每一則留言建立成節點
    this.comments.forEach((comment) => {
      nodeMap.set(comment.id, {
        comment,
        replies: [],
        showAllReplies: false,
      });
    });

    const parentComments: CommentThreadNode[] = [];

    // 再依照 parent_comment_id 建立留言關係
    this.comments.forEach((comment) => {
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

    if (!content) {
      return;
    }

    if (!this.demandId) {
      console.error('[災害留言頁] 找不到需求 ID');
      return;
    }

    try {
      const newComment = await this.disasterCommentService.addComment(
        this.demandId,
        null,
        'agency',
        '目前使用者',
        content,
        this.replyingTo?.id ?? null
      );

      this.comments = [newComment, ...this.comments];
      this.buildCommentThreads();

      this.newComment = '';
      this.replyingTo = null;

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言頁] 新增留言失敗：', error);
    }
  }

  hasLiked(comment: DisasterComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  async toggleLike(comment: DisasterComment): Promise<void> {
    try {
      const updatedComment = await this.disasterCommentService.toggleLike(comment.id, this.currentUserId);

      const index = this.comments.findIndex((item) => item.id === comment.id);

      if (index !== -1) {
        this.comments[index] = updatedComment;
        this.buildCommentThreads();
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言頁] 愛心操作失敗：', error);
    }
  }

  getReplyTargetName(parentCommentId: number): string {
    const parentComment = this.comments.find((comment) => comment.id === parentCommentId);

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
