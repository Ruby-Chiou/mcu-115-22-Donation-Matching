import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DailyDemandService } from '../../../../core/services/agency-daily-demand/daily-demand.service';
import { DailyDemand } from '../../../../models/agency/daily-demand';
import { SupplyDetailCarouselComponent } from '../../../../components/carousel/supply-detail-carousel/supply-detail-carousel.component';
import { BeneficiaryPublicProfileService } from '../../../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPanelComponent } from '../../../../components/card/beneficiary-panel/beneficiary-panel.component';
import { CommentAuthorChipComponent } from '../../../../components/comment/comment-author-chip.component';
import { commentAuthor, commentWriteError, withCommentPreviews } from '../../../../components/comment/comment-author.data';
import { AuthSessionService } from '../../../../core/services/auth/auth-session.service';
import { DailyCommentService } from '../../../../core/services/comments/daily-comment.service';
import { DailyComment } from '../../../../core/services/comments/daily-comment.service';
import { AuthRedirectService } from '../../../../core/services/auth/auth-redirect.service';

interface CommentThreadNode {
  comment: DailyComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-donor-daily-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule, FormsModule, SupplyDetailCarouselComponent, BeneficiaryPanelComponent, CommentAuthorChipComponent],
  templateUrl: './donor-daily-detail.component.html',
  styleUrl: './donor-daily-detail.component.scss',
})
export class DonorDailyDetailComponent implements OnInit, OnDestroy {
  private readonly currentUserId = '00000000-0000-0000-0000-000000000011';
  private readonly authRedirect = inject(AuthRedirectService);
  private readonly auth = inject(AuthSessionService);
  protected readonly beneficiaryProfiles = inject(BeneficiaryPublicProfileService);
  demand?: DailyDemand;
  currentImageIndex = 0;
  private imageTimer?: ReturnType<typeof setInterval>;
  isLoading = true;
  loadError = '';
  commentNotice = '';
  commentSending = false;

  get beneficiary() {
    return this.beneficiaryProfiles.findForPlace(this.demand?.recipient ?? '', this.demand?.address ?? '');
  }

  requestDonate(): void {
    const id = this.demand?.id;

    if (id == null) {
      return;
    }

    void this.authRedirect.openDonorAction(`/donor/daily/form/${id}`);
  }

  constructor(
    private route: ActivatedRoute,
    private dailyDemandService: DailyDemandService,
    private dailyCommentService: DailyCommentService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.loadError = '網址中的物資需求編號不正確。';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      await Promise.all([this.loadDemandData(id), this.beneficiaryProfiles.ensureLoaded()]);

      console.log('目前需求：', this.demand);
      console.log('圖片數量：', this.demand?.image?.length);

      if (!this.demand) {
        this.loadError = '找不到此筆物資需求。';
        return;
      }
      // 載入目前日常需求的留言
      await this.loadComments(id);
    } catch (error) {
      console.error('讀取物資需求資料失敗：', error);

      this.loadError = '資料讀取失敗，請稍後再試。';
    } finally {
      this.isLoading = false;

      // 非同步 Supabase 資料回來後，通知 Angular 更新畫面。
      this.cdr.detectChanges();
    }
  }

  // 載入資料並啟動輪播
  private async loadDemandData(id: number): Promise<void> {
    this.stopImageTimer();
    this.currentImageIndex = 0;

    const demand = await this.dailyDemandService.getDemandById(id);

    console.log('目前需求：', demand);
    console.log('圖片數量：', demand?.image?.length);

    this.demand = demand;

    if (this.demand?.image?.length) {
      this.startImageTimer();
    }
  }

  // 啟動輪播計時器
  private startImageTimer(): void {
    this.stopImageTimer(); // 確保不會重複啟動多個計時器

    if (this.demand?.image && this.demand.image.length > 1) {
      this.imageTimer = setInterval(() => {
        if (!this.demand?.image?.length) return;

        this.currentImageIndex = (this.currentImageIndex + 1) % this.demand.image.length;

        console.log('自動切換圖片：', this.currentImageIndex);

        // 手動通知 Angular 畫面需要更新
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  // 停止輪播計時器
  private stopImageTimer(): void {
    if (this.imageTimer) {
      clearInterval(this.imageTimer);
      this.imageTimer = undefined;
    }
  }

  // 點擊圓點切換圖片
  goToImage(index: number): void {
    this.currentImageIndex = index;
    // 點擊後重新計時，避免使用者剛點完又被自動輪播切走
    this.startImageTimer();
  }

  // 元件銷毀時清除計時器
  ngOnDestroy(): void {
    this.stopImageTimer();
  }

  // =========================
  // 取得接收方式文字
  // =========================
  getReceiveMethod(): string {
    if (!this.demand?.receiveMethod) {
      return '';
    }

    const methods = [];

    if (this.demand.receiveMethod.寄送) {
      methods.push('寄送');
    }

    if (this.demand.receiveMethod.面交) {
      methods.push('面交');
    }

    return methods.join('、');
  }

  // =========================
  // 判斷是否有自訂狀態
  // =========================
  hasCustomConditions(): boolean {
    return (
      Array.isArray(this.demand?.customConditions) &&
      this.demand.customConditions.some((condition: string) => condition && condition.trim() !== '')
    );
  }

  // =========================
  // 取得優先度 CSS
  // =========================
  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case '非常緊急':
        return 'priority-urgent';

      case '緊急':
        return 'priority-normal';

      case '普通':
        return 'priority-low';

      default:
        return 'priority-default';
    }
  }

  // =========================
  // 地址只顯示到區／鄉鎮市
  // =========================
  getRegion(address: string | undefined): string {
    if (!address) {
      return '';
    }

    const match = address.match(/^(.*?[縣市].*?[區鄉鎮市])/);

    return match ? match[1] : address;
  }

  // =========================
  // 物資狀態要求
  // =========================
  getConditions(): string {
    const conditions = this.demand?.conditions;

    if (!conditions) {
      return '無';
    }

    return Object.entries(conditions)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}：${value}`)
      .join('\n');
  }

  // =========================
  // 留言
  // =========================
  newComment = '';

  comments: DailyComment[] = [];

  replyingTo: DailyComment | null = null;

  // 主留言及其所有層級的回覆
  commentThreads: CommentThreadNode[] = [];

  // 載入留言
  async loadComments(demandId: number): Promise<void> {
    try {
      this.comments = await this.dailyCommentService.getComments(demandId);
      this.buildCommentThreads();
    } catch (error) {
      console.error('[日常留言] 載入留言失敗：', error);

      this.comments = [];
      this.buildCommentThreads();
    }
  }

  // 開始回覆
  replyTo(comment: DailyComment): void {
    this.replyingTo = comment;
    this.newComment = '';

    this.cdr.detectChanges();
  }

  // 取消回覆
  cancelReply(): void {
    this.replyingTo = null;
    this.newComment = '';

    this.cdr.detectChanges();
  }

  // 新增留言或回覆
  async addComment(): Promise<void> {
    const content = this.newComment.trim();
    this.commentNotice = '';

    if (!content) {
      this.commentNotice = '請先輸入留言內容。';
      this.cdr.detectChanges();
      return;
    }

    if (!this.demand?.id) {
      this.commentNotice = '找不到這筆需求，留言沒有送出。';
      this.cdr.detectChanges();
      return;
    }

    const author = commentAuthor(this.auth.principal(), 'donor');
    const parentId = this.replyingTo?.id ?? null;

    if (parentId !== null && parentId < 0) {
      this.comments = [
        {
          id: -Date.now(),
          demand_id: this.demand.id,
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

    this.commentSending = true;
    this.cdr.detectChanges();

    try {
      const newComment = await this.dailyCommentService.addComment(
        this.demand.id,
        author.userId,
        author.role,
        author.name,
        content,
        parentId,
      );

      this.comments = [newComment, ...this.comments];
      this.newComment = '';
      this.replyingTo = null;
      this.buildCommentThreads();
    } catch (error) {
      console.error('[日常留言] 新增留言失敗：', error);
      this.commentNotice = commentWriteError(error);
    } finally {
      this.commentSending = false;
      this.cdr.detectChanges();
    }
  }

  // 按讚
  // 按讚
  async toggleLike(comment: DailyComment): Promise<void> {
    if (comment.id < 0) {
      return;
    }

    console.log('[日常留言] 愛心按鈕已點擊', comment);

    try {
      const updatedComment = await this.dailyCommentService.toggleLike(comment.id, this.currentUserId);

      console.log('[日常留言] 按讚更新結果：', updatedComment);

      const index = this.comments.findIndex((item) => item.id === comment.id);

      if (index !== -1) {
        this.comments[index] = updatedComment;
      }

      this.buildCommentThreads();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[日常留言] 愛心操作失敗：', error);
    }
  }

  // 判斷目前使用者是否已按讚
  hasLiked(comment: DailyComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  // 取得被回覆的留言者名稱
  getReplyTargetName(parentCommentId: number): string {
    const parentComment = withCommentPreviews(this.comments, this.demand?.id ?? 0).find((comment) => comment.id === parentCommentId);

    return parentComment?.user_name ?? '原留言者';
  }

  // 格式化留言時間
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

  // 建立主留言與巢狀回覆
  buildCommentThreads(): void {
    const expandedStates = new Map<number, boolean>();

    for (const thread of this.commentThreads) {
      expandedStates.set(thread.comment.id, thread.showAllReplies);
    }

    const comments = withCommentPreviews(this.comments, this.demand?.id ?? 0);
    const nodeMap = new Map<number, CommentThreadNode>();

    // 先建立所有留言節點
    for (const comment of comments) {
      nodeMap.set(comment.id, {
        comment,
        replies: [],
        showAllReplies: expandedStates.get(comment.id) ?? false,
      });
    }

    const roots: CommentThreadNode[] = [];

    // 依照 parent_comment_id 建立留言關係
    for (const comment of comments) {
      const node = nodeMap.get(comment.id);

      if (!node) {
        continue;
      }

      const parentId = comment.parent_comment_id;

      if (parentId !== null && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    // 主留言由新到舊排序
    roots.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime());

    // 各層回覆由舊到新排序
    const sortReplies = (nodes: CommentThreadNode[]): void => {
      nodes.sort((a, b) => new Date(a.comment.created_at).getTime() - new Date(b.comment.created_at).getTime());

      for (const node of nodes) {
        sortReplies(node.replies);
      }
    };

    for (const root of roots) {
      sortReplies(root.replies);
    }

    this.commentThreads = roots;
  }

  // 計算所有層級的後代回覆數量
  countDescendantReplies(node: CommentThreadNode): number {
    return node.replies.reduce((total, reply) => total + 1 + this.countDescendantReplies(reply), 0);
  }

  // 展開或收起主留言底下的回覆
  toggleReplies(thread: CommentThreadNode): void {
    thread.showAllReplies = !thread.showAllReplies;

    this.cdr.detectChanges();
  }
}
