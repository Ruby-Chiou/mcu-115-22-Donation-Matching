import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VolunteerDeleteComponent } from '../../modal/volunteer-delete/volunteer-delete.component';
import { VolunteerDemandService  } from '../../../core/services/volunteer-demand.service';
import {  VolunteerDemand } from '../../../models/agency/vdemand';
import { PaginationComponent } from '../../pagination/pagination.component';

type VolunteerSortType = 'id'|'createdAt' | 'people';
type VolunteerStatus = '上架' | '隱藏' | '下架';
type VolunteerDisplayStatus =
  | '已上架'
  | '隱藏中'
  | '已下架';
@Component({
  selector: 'app-volunteer-list',
  imports: [CommonModule,FormsModule,RouterLink,PaginationComponent,VolunteerDeleteComponent ],
  templateUrl: './volunteer-list.component.html',
  styleUrl: './volunteer-list.component.scss',
})
export class VolunteerListComponent {
// ======================================================
// 志工需求資料
// ======================================================

volunteerDemands: (
  VolunteerDemand & {

    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
)[] = [];

// 篩選後 + 排序後的完整資料
allFilteredVolunteerDemands: (
  VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
)[] = [];

// 目前頁面顯示資料
filteredVolunteerDemands: (
  VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
)[] = [];
// =========================
  // 搜尋
  // =========================

  searchTerm = '';

  // =========================
  // 刪除
  // =========================
// ======================================================
// 分頁
// ======================================================

volunteerCurrentPage = 1;
volunteerPageSize = 10;
volunteerTotalPages = 1;
volunteerPageNumbers: number[] = [];

showDeleteModal = false;
deleteIds: number[] = [];
deleteType: 'single' | 'batch' = 'single';
// =========================
  // 搜尋
  // =========================

  onSearch() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

// 志工全選
volunteerSelectAll = false;
// 志工排序

// 志工篩選 Modal
showVolunteerFilterModal = false;

// 載入志工需求
// 載入志工需求
loadVolunteerDemands(): void {

  this.volunteerDemands =
    this.volunteerDemandService.getDemands().map((item) => {

      let displayStatus: VolunteerDisplayStatus = '已上架';

      if (item.status === '上架') {
        displayStatus = '已上架';
      } else if (item.status === '隱藏') {
        displayStatus = '隱藏中';
      } else if (item.status === '下架') {
        displayStatus = '已下架';
      }

      return {
        ...item,
        selected: false,
        displayStatus,

        displayCreatedAt:
          item.status === '隱藏'
            ? '尚未發布'
            : item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('zh-TW')
              : '尚未發布'
      };
    });

  // ======================================================
  // 第一次打開：固定按照編號牌 ID，由小到大
  // ======================================================
  this.volunteerDemands.sort((a, b) => {
    return Number(a.id) - Number(b.id);
  });

  // 一開始全部資料維持編號牌順序
  this.allFilteredVolunteerDemands = [
    ...this.volunteerDemands
  ];

  // ======================================================
  // 第一次載入不要套用發布時間 / 人數排序
  // ======================================================

  this.volunteerCurrentPage = 1;
  this.updateVolunteerPagination();
}
pagePositionKey = 'volunteerListPage';

 ngOnInit() {
    const savedPage = sessionStorage.getItem(this.pagePositionKey);

    if (savedPage) {
      const page = Number(savedPage);

      if (page >= 1) {
        this.volunteerCurrentPage = page;
      }
    }
    // 志工需求
  this.loadVolunteerDemands();
  }
constructor(
    private volunteerDemandService: VolunteerDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }
// 志工全選
toggleVolunteerAll(): void {

  this.filteredVolunteerDemands.forEach(item => {
    item.selected = this.volunteerSelectAll;
  });

}
// 志工是否有選取
hasSelectedVolunteer(): boolean {
  return this.filteredVolunteerDemands
    .some((item) => item.selected);
}
saveListPosition(): void {
  sessionStorage.setItem(
    this.pagePositionKey,
    this.volunteerCurrentPage.toString()
  );
}
// 志工單筆編輯
goToVolunteerEdit(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/volunteer-edit', id]);
  }

// 志工批次編輯
editSelectedVolunteer(): void {
  const selectedItems =
    this.filteredVolunteerDemands
      .filter((item) => item.selected);
  if (selectedItems.length === 0) {
    alert('請先選擇要修改的志工需求');
    return;
  }

  localStorage.setItem(
    'editVolunteerDemands',
    JSON.stringify(selectedItems)
  );
  this.saveListPosition();
  this.router.navigate([
    '/agency/volunteer-batch-edit'
  ]);
}

 // 開啟單筆刪除 Modal
openDeleteModal(id: number): void {
  this.deleteIds = [id];
  this.deleteType = 'single';
  this.showDeleteModal = true;
}

// 開啟批次刪除 Modal
openBatchDeleteModal(): void {
  this.deleteIds = this.filteredVolunteerDemands
    .filter((item) => item.selected && item.id !== undefined)
    .map((item) => item.id as number);

  this.deleteType = 'batch';
  this.showDeleteModal = true;
}

// 關閉 / 取消 Modal (點擊「取消」或「背景」時觸發)
closeDeleteModal(): void {
  this.showDeleteModal = false;
  this.deleteIds = [];
}

// 確定刪除成功後的處置
onDeleted(): void {
  this.closeDeleteModal();
  this.volunteerSelectAll = false;
  this.loadVolunteerDemands();
}

// 志工排序下拉選單
volunteerSelectedSort: string = 'id';

volunteerSortAscending: boolean = false;

volunteerSortDropdownOpen: boolean = false;

volunteerSortOptions = [
  {
    value: 'createdAt',
    label: '發布時間'
  },
  {
    value: 'people',
    label: '需求人數'
  },
];
// ======================================================
// 志工篩選
// ======================================================

statusOptions: VolunteerDisplayStatus[] = [
  '已上架',
  '隱藏中',
  '已下架'
];

priorityOptions: VolunteerDemand['priority'][] = [
  '普通',
  '緊急',
  '非常緊急'
];

// 志工類型
categoryOptions: string[] = [
  '物資搬運',
  '物資整理',
  '環境清潔',
  '醫療照護',
  '其他'
];

// 留言狀態
messageOptions: string[] = [
  '已回覆',
  '未回覆'
];

selectedFilters = {
  status: [] as VolunteerDisplayStatus[],
  priority: [] as VolunteerDemand['priority'][],
  category: [] as string[],
  messageStatus: [] as string[]
};

resetFilters(): void {
  this.selectedFilters = {
    status: [],
    priority: [],
    category: [],
    messageStatus: []
  };

  // 恢復全部資料，並按照編號牌排序
  this.allFilteredVolunteerDemands = [
    ...this.volunteerDemands
  ].sort((a, b) => {
    return Number(a.id) - Number(b.id);
  });

  this.volunteerCurrentPage = 1;

  this.updateVolunteerPagination();
}

toggleVolunteerSortDropdown(): void {
  this.volunteerSortDropdownOpen =
    !this.volunteerSortDropdownOpen;
}

// 志工排序名稱
getVolunteerSortLabel(): string {
  const found =
    this.volunteerSortOptions.find(
      opt => opt.value === this.volunteerSelectedSort
    );

  return found
    ? found.label
    : '發布時間';
}

// 志工選擇排序方向
toggleVolunteerSortOrder(): void {
  this.volunteerSortAscending =
    !this.volunteerSortAscending;

  this.applyVolunteerSort();
}

// 志工排序
applyVolunteerSort(resetPage: boolean = true): void {

  this.allFilteredVolunteerDemands.sort((a, b) => {

    // ======================================================
    // 發布時間排序
    // ======================================================
    if (this.volunteerSelectedSort === 'createdAt') {

      // 尚未發布的判斷
      const aUnpublished =
        a.status === '隱藏' ||
        !a.createdAt;

      const bUnpublished =
        b.status === '隱藏' ||
        !b.createdAt;

      // ------------------------------------------
      // 一個尚未發布、一個有發布時間
      // ------------------------------------------
      if (aUnpublished && !bUnpublished) {

        // 舊 → 新：尚未發布最後
        // 新 → 舊：尚未發布最前
        return this.volunteerSortAscending ? 1 : -1;
      }

      if (!aUnpublished && bUnpublished) {

        // 舊 → 新：尚未發布最後
        // 新 → 舊：尚未發布最前
        return this.volunteerSortAscending ? -1 : 1;
      }

      // ------------------------------------------
      // 兩個都是尚未發布
      // ------------------------------------------
      if (aUnpublished && bUnpublished) {
        return 0;
      }

      // ------------------------------------------
      // 兩個都有發布時間
      // ------------------------------------------
      const aTime = new Date(a.createdAt!).getTime();
      const bTime = new Date(b.createdAt!).getTime();

      return this.volunteerSortAscending
        ? aTime - bTime
        : bTime - aTime;
    }

    // ======================================================
    // 需求人數排序
    // ======================================================
    if (this.volunteerSelectedSort === 'people') {

      const result =
        Number(a.people ?? 0) -
        Number(b.people ?? 0);

      return this.volunteerSortAscending
        ? result
        : -result;
    }

    // ======================================================
    // 編號牌排序
    // ======================================================
    if (this.volunteerSelectedSort === 'id') {

      const result =
        Number(a.id ?? 0) -
        Number(b.id ?? 0);

      return this.volunteerSortAscending
        ? result
        : -result;
    }

    return 0;
  });

  // ======================================================
  // 排序後重新分頁
  // ======================================================
  if (resetPage) {
    this.volunteerCurrentPage = 1;
  }

  this.updateVolunteerPagination();
}
selectVolunteerSort(value: string): void {

  this.volunteerSelectedSort = value;

  this.volunteerSortDropdownOpen = false;

  this.applyVolunteerSort();
}
// 志工篩選 Modal
openVolunteerFilterModal(): void {
  this.showVolunteerFilterModal =
    true;
}
closeVolunteerFilterModal(): void {
  this.showVolunteerFilterModal =
    false;
}
// 志工狀態修改
changeVolunteerStatus(
  item: VolunteerDemand & {
    selected: boolean;
    displayCreatedAt: string;
    displayStatus: VolunteerDisplayStatus;
  }
): void {

  // 將顯示狀態轉換成資料實際狀態
  switch (item.displayStatus) {

    case '已上架':
      item.status = '上架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;

    case '隱藏中':
      item.status = '隱藏';

      item.displayCreatedAt = '尚未發布';

      break;

    case '已下架':
      item.status = '下架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;

    default:
      item.status = '上架';

      item.displayStatus = '已上架';

      item.displayCreatedAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-TW')
        : '尚未發布';

      break;
  }


}

updateVolunteerPagination(): void {

  this.volunteerTotalPages = Math.ceil(
    this.allFilteredVolunteerDemands.length /
    this.volunteerPageSize
  );

  if (this.volunteerTotalPages < 1) {
    this.volunteerTotalPages = 1;
  }

  if (
    this.volunteerCurrentPage >
    this.volunteerTotalPages
  ) {
    this.volunteerCurrentPage =
      this.volunteerTotalPages;
  }

  const start =
    (this.volunteerCurrentPage - 1) *
    this.volunteerPageSize;

  const end =
    start + this.volunteerPageSize;

  // ★ 只有這裡負責目前頁面資料
  this.filteredVolunteerDemands =
    this.allFilteredVolunteerDemands.slice(start, end);

  this.volunteerPageNumbers =
    Array.from(
      { length: this.volunteerTotalPages },
      (_, i) => i + 1
    );
}
goToVolunteerPage(page: number): void {

  if (
    page < 1 ||
    page > this.volunteerTotalPages
  ) {
    return;
  }

  this.volunteerCurrentPage = page;

  this.updateVolunteerPagination();
}
toggleFilter(
  type: 'status' | 'priority' | 'category' | 'messageStatus',
  value: string
): void {

  const list = this.selectedFilters[type] as string[];

  const index = list.indexOf(value);

  if (index === -1) {
    list.push(value);
  } else {
    list.splice(index, 1);
  }
}
applyFilters(): void {

  this.allFilteredVolunteerDemands =
    this.volunteerDemands.filter(item => {
 if (
        this.searchTerm &&
        this.searchTerm.trim() !== ''
      ) {
        const term =
          this.searchTerm.trim().toLowerCase();

        const matchItem =
          item.status
            ? item.status.toLowerCase().includes(term)
            : false;

        const matchCategory =
          item.type
            ? item.type.toLowerCase().includes(term)
            : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }
      // =========================
      // 上架狀態
      // =========================
      const statusMatch =
        this.selectedFilters.status.length === 0 ||
        this.selectedFilters.status.includes(
          item.displayStatus
        );

      // =========================
      // 優先度
      // =========================
      const priorityMatch =
        this.selectedFilters.priority.length === 0 ||
        this.selectedFilters.priority.includes(
          item.priority
        );

      // =========================
      // 類別
      // 志工的 type 就是類別
      // =========================
      const categoryMatch =
        this.selectedFilters.category.length === 0 ||
        this.selectedFilters.category.includes(
          item.type
        );

      // =========================
      // 留言狀態
      // =========================
      const messageMatch =
        this.selectedFilters.messageStatus.length === 0 ||
        this.selectedFilters.messageStatus.includes(
          (item.messageCount ?? 0) > 0
            ? '有留言'
            : '無留言'
        );

      return (
        statusMatch &&
        priorityMatch &&
        categoryMatch &&
        messageMatch
      );
    });

  // ★ 篩選完成後重新套用目前排序
  this.applyVolunteerSort();

  this.showVolunteerFilterModal = false;
}
updateVolunteerFilteredPagination(): void {

  this.volunteerTotalPages = Math.ceil(
    this.filteredVolunteerDemands.length /
    this.volunteerPageSize
  );

  if (this.volunteerTotalPages < 1) {
    this.volunteerTotalPages = 1;
  }

  if (
    this.volunteerCurrentPage >
    this.volunteerTotalPages
  ) {
    this.volunteerCurrentPage =
      this.volunteerTotalPages;
  }

  const start =
    (this.volunteerCurrentPage - 1) *
    this.volunteerPageSize;

  const end =
    start + this.volunteerPageSize;

  this.filteredVolunteerDemands =
    this.filteredVolunteerDemands.slice(start, end);

  this.volunteerPageNumbers =
    Array.from(
      { length: this.volunteerTotalPages },
      (_, i) => i + 1
    );
}
}


