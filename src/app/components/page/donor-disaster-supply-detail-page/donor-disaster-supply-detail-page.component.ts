import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SupplyDetailCarouselComponent } from '../../carousel/supply-detail-carousel/supply-detail-carousel.component';

import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/disaster-demand';

import { DisasterCommentService } from '../../../core/services/comments/disaster-comment.service';
import { DisasterComment } from '../../../core/services/comments/disaster-comment.service';

// 每一筆留言及其底下的所有回覆
interface CommentThreadNode {
  comment: DisasterComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-disaster-supply-detail-page',
  imports: [FormsModule, NgClass, NgTemplateOutlet, SupplyDetailCarouselComponent],
  templateUrl: './donor-disaster-supply-detail-page.component.html',
  styleUrl: './donor-disaster-supply-detail-page.component.scss',
})
export class DonorDisasterSupplyDetailPageComponent implements OnInit {
  private readonly currentUserId = '00000000-0000-0000-0000-000000000001';
  // =========================
  // 目前查看的需求
  // =========================
  demand!: DisasterDemand;

  isLoading = true;
  loadError = '';
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly disasterDemandService: DisasterDemandService,
    private readonly disasterCommentService: DisasterCommentService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    console.log('[災害詳細頁] route id：', rawId);

    const id = Number(rawId);

    console.log('[災害詳細頁] number id：', id);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[災害詳細頁] 無效的資料庫 id：', id);

      this.loadError = '網址中的災害物資編號不正確。';

      this.isLoading = false;
      return;
    }

    try {
      console.log('[災害詳細頁] 開始查詢資料');

      const demand = await this.disasterDemandService.getDemandById(id);

      console.log('[災害詳細頁] 查詢結果：', demand);

      if (!demand) {
        this.loadError = '找不到此筆災害物資需求。';

        return;
      }

      this.demand = demand;

      console.log('[災害詳細頁] demand 指派完成：', this.demand);

      // 載入此筆災害需求的留言
      await this.loadComments(id);
    } catch (error) {
      console.error('[災害詳細頁] 查詢失敗：', error);

      this.loadError = '讀取災害物資資料失敗，請稍後再試。';
    } finally {
      this.isLoading = false;

      console.log('[災害詳細頁] isLoading：', this.isLoading);

      // 強制 Angular 重新判斷 @if (isLoading) 與 @else if (demand)
      this.cdr.detectChanges();
    }
  }

  // =========================
  // 載入留言
  // =========================
  async loadComments(demandId: number): Promise<void> {
    try {
      console.log('[災害留言] 開始載入留言，demand_id：', demandId);

      this.comments = await this.disasterCommentService.getComments(demandId);

      console.log('[災害留言] 載入結果：', this.comments);

      this.buildCommentThreads();
    } catch (error) {
      console.error('[災害留言] 載入留言失敗：', error);

      this.comments = [];
      this.commentThreads = [];
    }
  }

  // =========================
  // 前往物資捐助表單
  // =========================
  goToSupplyForm(): void {
    this.router.navigate(['/donor/disaster/supply/form', this.demand.id]);
  }

  // =========================
  // 返回需求清單
  // =========================
  goBackToList(): void {
    this.router.navigate(['/donor/disaster'], {
      queryParams: {
        section: 'material',
      },
    });
  }
  // =========================
  // 接受狀態文字
  // =========================
  getConditionText(condition: '接受' | '不接受' | ''): string {
    if (condition === '接受') {
      return '✔ 接受';
    }
    if (condition === '不接受') {
      return '✘ 不接受';
    }
    return '';
  }
  // =========================
  // 緊急程度樣式
  // =========================
  getPriorityClass(): string {
    switch (this.demand.priority) {
      case '非常緊急':
        return 'very-urgent';
      case '緊急':
        return 'urgent';
      default:
        return 'normal';
    }
  }
  // =========================
  // 留言
  // =========================
  newComment = '';

  comments: DisasterComment[] = [];

  replyingTo: DisasterComment | null = null;

  // 主留言及其所有層級的回覆
  commentThreads: CommentThreadNode[] = [];

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

    if (!this.demand?.id) {
      console.error('[災害留言] 找不到需求 ID');
      return;
    }

    try {
      console.log('[災害留言] 開始新增留言');

      // 新增留言，並取得剛剛新增成功的留言資料
      const newComment = await this.disasterCommentService.addComment(
        this.demand.id,
        null,
        'donor',
        '目前使用者',
        content,
        this.replyingTo?.id ?? null
      );

      console.log('[災害留言] 新增成功：', newComment);

      // 加入留言資料
      this.comments = [newComment, ...this.comments];

      // 重新整理主留言與回覆
      this.buildCommentThreads();

      // 清空輸入框
      this.newComment = '';

      // 確保畫面立即更新
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言] 新增留言失敗：', error);
    }
  }

  async toggleLike(comment: DisasterComment): Promise<void> {
    try {
      const updatedComment = await this.disasterCommentService.toggleLike(comment.id, this.currentUserId);

      // 更新目前 comments 裡面的資料
      const index = this.comments.findIndex((item) => item.id === comment.id);

      if (index !== -1) {
        this.comments[index] = updatedComment;
      }

      // 重新建立留言串
      this.buildCommentThreads();

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[災害留言] 愛心操作失敗：', error);
    }
  }

  hasLiked(comment: DisasterComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  // 取得被回覆的留言者名稱
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

  buildCommentThreads(): void {
    // 記住每筆主留言目前是否已展開回覆
    const expandedStates = new Map<number, boolean>();

    for (const thread of this.commentThreads) {
      expandedStates.set(thread.comment.id, thread.showAllReplies);
    }

    const nodeMap = new Map<number, CommentThreadNode>();

    // 1. 先替每一筆留言建立節點
    for (const comment of this.comments) {
      nodeMap.set(comment.id, {
        comment,
        replies: [],
        showAllReplies: expandedStates.get(comment.id) ?? false,
      });
    }

    const roots: CommentThreadNode[] = [];

    // 2. 依照 parent_comment_id 將回覆放到正確的留言底下
    for (const comment of this.comments) {
      const node = nodeMap.get(comment.id);

      if (!node) {
        continue;
      }

      const parentId = comment.parent_comment_id;

      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.replies.push(node);
      } else {
        // 沒有父留言的資料，視為主留言
        roots.push(node);
      }
    }

    // 3. 主留言依照最新時間排序
    roots.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime());

    // 4. 每一層的回覆依照時間由舊到新排序
    const sortReplies = (nodes: CommentThreadNode[]): void => {
      nodes.sort((a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime());

      for (const node of nodes) {
        sortReplies(node.replies);
      }
    };

    for (const root of roots) {
      sortReplies(root.replies);
    }

    console.log(
      '[留言回覆數量檢查]',
      roots.map((root) => ({
        主留言: root.comment.content,
        直接回覆數量: root.replies.length,
        顯示更多數量: Math.max(0, root.replies.length - 1),
        回覆內容: root.replies.map((reply) => reply.comment.content),
      }))
    );

    this.commentThreads = roots;
  }

  // 計算同一筆留言底下，所有層級的後代回覆數量
  countDescendantReplies(node: CommentThreadNode): number {
    return node.replies.reduce((total, reply) => total + 1 + this.countDescendantReplies(reply), 0);
  }

  toggleReplies(thread: CommentThreadNode): void {
    thread.showAllReplies = !thread.showAllReplies;

    this.cdr.detectChanges();
  }
}
