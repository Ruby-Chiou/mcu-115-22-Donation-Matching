import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import { BeneficiaryPublicProfileService } from '../../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPanelComponent } from '../../card/beneficiary-panel/beneficiary-panel.component';
import { AGENCY_OFFICE } from '../../../models/user/agency';
import { VolunteerDemandService } from '../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/agency/volunteer-demand';
import { VolunteerCommentService, VolunteerComment } from '../../../core/services/comments/volunteer-comment.service';
import { AuthRedirectService } from '../../../core/services/auth/auth-redirect.service';

interface CommentThreadNode {
  comment: VolunteerComment;
  replies: CommentThreadNode[];
  showAllReplies: boolean;
}

@Component({
  selector: 'app-donor-disaster-volunteer-detail-page',
  imports: [CommonModule, FormsModule, BeneficiaryPanelComponent],
  templateUrl: './donor-disaster-volunteer-detail-page.component.html',
  styleUrl: './donor-disaster-volunteer-detail-page.component.scss',
})
export class DonorDisasterVolunteerDetailPageComponent implements OnInit {
  private readonly authRedirect = inject(AuthRedirectService);
  protected readonly beneficiaryProfiles = inject(BeneficiaryPublicProfileService);

  get beneficiary() {
    return this.beneficiaryProfiles.findForPlace(AGENCY_OFFICE.agencyName, this.volunteer?.location ?? '');
  }
  volunteer?: VolunteerDemand;
  isLoading = true;
  loadError = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly volunteerCommentService: VolunteerCommentService,
    private readonly location: Location,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    console.log('[志工詳細頁] route id：', id);

    try {
      const [volunteer] = await Promise.all([
        this.volunteerDemandService.getDemandById(id),
        this.beneficiaryProfiles.ensureLoaded(),
      ]);

      if (!volunteer) {
        this.loadError = '找不到此筆志工需求。';
        return;
      }

      this.volunteer = volunteer;

      // 載入這筆志工需求的留言
      await this.loadComments(volunteer.id);
    } catch (error) {
      console.error('[志工詳細頁] 查詢失敗：', error);
      this.loadError = '讀取志工需求失敗。';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getRemaining(): number {
    return this.volunteer?.people ?? 0;
  }
  getProgress(): number {
    return 0;
  }
  goToVolunteerForm(): void {
    const id = this.volunteer?.id;

    if (id == null) {
      return;
    }

    void this.authRedirect.openDonorAction(`/donor/disaster/volunteer/form/${id}`);
  }
  // 返回志工需求清單

  goBackToList(): void {
    this.router.navigate(['/donor/disaster'], { queryParams: { section: 'volunteer' } });
  }
  // =========================
  // 留言
  // =========================
  newComment = '';
  replyContent = '';

  comments: VolunteerComment[] = [];
  commentThreads: CommentThreadNode[] = [];
  replyingTo: VolunteerComment | null = null;

  // 暫時使用測試用使用者 ID，之後再串接登入資訊
  currentUserId = '00000000-0000-0000-0000-000000000021';

  // 從資料庫載入留言
  async loadComments(demandId: number): Promise<void> {
    try {
      this.comments = await this.volunteerCommentService.getComments(demandId);

      this.buildCommentThreads();
    } catch (error) {
      console.error('[志工留言] 載入留言失敗：', error);
      this.comments = [];
      this.commentThreads = [];
    }
  }

  // 將平面的留言資料整理成巢狀回覆

  buildCommentThreads(): void {
    // 記住每一筆留言目前是否已展開回覆
    const expandedStates = new Map<number, boolean>();

    for (const thread of this.commentThreads) {
      expandedStates.set(thread.comment.id, thread.showAllReplies);
    }

    const nodeMap = new Map<number, CommentThreadNode>();

    // 先替每一筆留言建立節點
    for (const comment of this.comments) {
      nodeMap.set(comment.id, {
        comment,
        replies: [],
        showAllReplies: expandedStates.get(comment.id) ?? false,
      });
    }

    const roots: CommentThreadNode[] = [];

    // 依照 parent_comment_id 建立父子關係
    for (const comment of this.comments) {
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

    // 主留言依照最新時間排序
    roots.sort((a, b) => new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime());

    // 每一層回覆依照時間由舊到新排序
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

  // 發布留言或回覆
  async addComment(): Promise<void> {
    const isReply = this.replyingTo !== null;
    const content = (isReply ? this.replyContent : this.newComment).trim();

    if (!content) {
      return;
    }

    const demandId = this.volunteer?.id;

    if (demandId == null) {
      console.error('[志工留言] 找不到志工需求 ID');
      return;
    }

    try {
      const comment = await this.volunteerCommentService.addComment(
        demandId,
        this.currentUserId,
        'donor',
        '目前使用者',
        content,
        this.replyingTo?.id ?? null
      );

      this.comments = [...this.comments, comment];

      if (isReply) {
        this.replyContent = '';
        this.replyingTo = null;
      } else {
        this.newComment = '';
      }

      this.buildCommentThreads();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[志工留言] 新增失敗：', error);
    }
  }

  // 開始回覆
  replyTo(comment: VolunteerComment): void {
    this.replyingTo = comment;
    this.replyContent = '';
    this.cdr.detectChanges();
  }

  // 取消回覆
  cancelReply(): void {
    this.replyingTo = null;
    this.replyContent = '';
    this.cdr.detectChanges();
  }

  // 判斷目前使用者是否已按愛心
  hasLiked(comment: VolunteerComment): boolean {
    return comment.liked_user_ids?.includes(this.currentUserId) ?? false;
  }

  // 切換愛心

  // 切換留言愛心
  async toggleLike(comment: VolunteerComment): Promise<void> {
    const index = this.comments.findIndex((item) => item.id === comment.id);

    if (index === -1) {
      return;
    }

    const previousComment = this.comments[index];
    const wasLiked = this.hasLiked(previousComment);

    // 先更新前端畫面
    const likedUserIds = previousComment.liked_user_ids ?? [];
    const updatedLikedUserIds = wasLiked ? likedUserIds.filter((id) => id !== this.currentUserId) : [...likedUserIds, this.currentUserId];

    this.comments[index] = {
      ...previousComment,
      like_count: Math.max(0, previousComment.like_count + (wasLiked ? -1 : 1)),
      liked_user_ids: updatedLikedUserIds,
    };

    this.buildCommentThreads();
    this.cdr.detectChanges();

    // 再儲存到資料庫
    try {
      const updatedComment = await this.volunteerCommentService.toggleLike(comment.id, this.currentUserId);

      const currentIndex = this.comments.findIndex((item) => item.id === comment.id);

      if (currentIndex !== -1) {
        this.comments[currentIndex] = updatedComment;
        this.buildCommentThreads();
        this.cdr.detectChanges();
      }
    } catch (error) {
      // 儲存失敗時，還原原本的資料
      const currentIndex = this.comments.findIndex((item) => item.id === comment.id);

      if (currentIndex !== -1) {
        this.comments[currentIndex] = previousComment;
        this.buildCommentThreads();
        this.cdr.detectChanges();
      }

      console.error('[志工留言] 愛心操作失敗：', error);
    }
  }

  // 取得回覆對象名稱
  getReplyTargetName(parentCommentId: number): string {
    return this.comments.find((comment) => comment.id === parentCommentId)?.user_name ?? '原留言';
  }

  // 格式化留言日期
  formatCommentDate(date: string): string {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return date;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hour = String(value.getHours()).padStart(2, '0');
    const minute = String(value.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hour}:${minute}`;
  }

  // 計算所有層級的回覆數
  countDescendantReplies(node: CommentThreadNode): number {
    let count = node.replies.length;

    for (const reply of node.replies) {
      count += this.countDescendantReplies(reply);
    }

    return count;
  }

  // 展開或收合回覆
  toggleReplies(node: CommentThreadNode): void {
    node.showAllReplies = !node.showAllReplies;
    this.cdr.detectChanges();
  }

  joinVolunteer(): void {
    alert('已送出志工報名！');
  }
}
