
import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VolunteerDeleteComponent } from '../../modal/volunteer-delete/volunteer-delete.component';
import { VolunteerDemandService  } from '../../../core/services/volunteer-demand.service';
import {  VolunteerDemand,VolunteerStatus,DisplayVolunteerStatus } from '../../../models/agency/vdemand';
import { PaginationComponent } from '../../pagination/pagination.component';

type SortType = 'createdAt' | 'amount' ;
@Component({
  selector: 'app-volunteer-list',
  imports: [CommonModule,FormsModule,RouterLink,PaginationComponent,VolunteerDeleteComponent ],
  templateUrl: './volunteer-list.component.html',
  styleUrl: './volunteer-list.component.scss',
})
export class VolunteerListComponent {
demands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
  })[] = [];

  filteredDemands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
  })[] = [];

  pagedDemands: (VolunteerDemand & {
    selected: boolean;
    displayStatus: DisplayVolunteerStatus;
    displayCreatedAt: string;
  })[] = [];

  selectAll = false;

  // =========================
  // 搜尋
  // =========================

  searchTerm = '';

  // =========================
  // 分頁
  // =========================

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  // =========================
  // 保留列表位置
  // =========================

  private readonly scrollPositionKey = 'agency-disaster-workspace-scroll';

  private readonly pagePositionKey = 'agency-disaster-workspace-page';

  // =========================
  // 排序
  // =========================

  selectedSort: SortType = 'createdAt';
  sortAscending = true;
  isSortDropdownOpen = false;

  private userHasSorted = false;

  sortOptions: { label: string; value: SortType }[] = [
    { label: '發布時間', value: 'createdAt' },
    { label: '需求人數', value: 'amount' },
  ];
  // =========================
  // 刪除
  // =========================

  showDeleteModal = false;
  deleteIds: number[] = [];
  deleteType: 'single' | 'batch' = 'single';

  // =========================
  // 篩選
  // =========================

  showFilterModal = false;

  statusOptions: DisplayVolunteerStatus[] = ['已上架', '隱藏中', '已下架'];

  priorityOptions: VolunteerDemand['priority'][] = ['普通', '緊急', '非常緊急'];

  categoryOptions: NonNullable<VolunteerDemand['type']>[] = ['物資搬運','物資整理','環境清潔','醫療照護','其他'];

  messageOptions = ['已回覆', '未回覆'];

  selectedFilters = {
    status: [] as string[],
    priority: [] as string[],
    lowRemaining: false,
    category: [] as string[],
    messageStatus: [] as string[],
  };

  constructor(
    private disasterDemandService: VolunteerDemandService,
    private router: Router
  ) {
    history.scrollRestoration = 'manual';
  }

  // =========================
  // 初始化
  // =========================

  ngOnInit() {
    const savedPage = sessionStorage.getItem(this.pagePositionKey);

    if (savedPage) {
      const page = Number(savedPage);

      if (page >= 1) {
        this.currentPage = page;
      }
    }

    this.loadDemands();
  }

  ngAfterViewInit() {
    const savedScroll = sessionStorage.getItem(this.scrollPositionKey);

    if (savedScroll) {
      const scrollY = Number(savedScroll);

      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }
  }

  // =========================
  // 新增
  // =========================

  goToAddDemand() {
    this.router.navigate(['/agency/supply-form']);
  }

  // =========================
  // 查看
  // =========================

  goToDetail(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/supply-detail', id], {
      queryParams: { number: id },
    });
  }

  // =========================
  // 編輯
  // =========================

  goToEdit(id: number) {
    this.saveListPosition();

    this.router.navigate(['/agency/volunteer-edit', id]);
  }

  // =========================
  // 儲存列表位置
  // =========================

  saveListPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  @HostListener('window:beforeunload')
  saveScrollPosition() {
    sessionStorage.setItem(this.scrollPositionKey, String(window.scrollY));

    sessionStorage.setItem(this.pagePositionKey, String(this.currentPage));
  }

  // =========================
  // 排序下拉選單
  // =========================

  @HostListener('document:click')
  closeSortDropdown() {
    this.isSortDropdownOpen = false;
  }

  toggleSortDropdown() {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  getSelectedSortLabel(): string {
    const found = this.sortOptions.find((opt) => opt.value === this.selectedSort);

    return found ? found.label : '發布時間';
  }

  selectSortOption(value: SortType) {
    const scrollY = window.scrollY;

    this.selectedSort = value;

    this.userHasSorted = true;

    this.isSortDropdownOpen = false;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  toggleSortOrder() {
    const scrollY = window.scrollY;

    this.userHasSorted = true;

    this.sortAscending = !this.sortAscending;

    this.applySort();

    setTimeout(() => {
      window.scrollTo({
        top: scrollY,
        behavior: 'instant',
      });
    }, 0);
  }

  // =========================
  // 讀取需求
  // =========================

  loadDemands() {
    this.demands = this.disasterDemandService.getDemands().map((item) => {
      let currentStatus: DisplayVolunteerStatus = '已上架';

      if (item.status === '上架') {
        currentStatus = '已上架';
      }

      if (item.status === '隱藏') {
        currentStatus = '隱藏中';
      }

      if (item.status === '下架') {
        currentStatus = '已下架';
      }

      return {
        ...item,

        selected: false,

        status: item.status,

        displayStatus: currentStatus,

        displayCreatedAt:
          item.status === '隱藏' ? '尚未發布' : item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布',

        category: item.type ?? '其他',
      };
    });

    this.applyFilters(false);
  }

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

  // =========================
  // 全選
  // =========================

  toggleAll() {
    this.pagedDemands.forEach((item) => {
      item.selected = this.selectAll;
    });
  }

  hasSelected() {
    return this.filteredDemands.some((item) => item.selected);
  }

  // =========================
  // 批次編輯
  // =========================

  editSelected() {
    const selectedItems = this.filteredDemands.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      alert('請先選擇要修改的需求');
      return;
    }

    localStorage.setItem('editVolunteerDemands', JSON.stringify(selectedItems));

    this.saveListPosition();

    this.router.navigate(['/agency/volunteer-batch-edit']);
  }

  // =========================
  // 篩選 Modal
  // =========================

  openFilterModal() {
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  toggleFilter(key: 'status' | 'priority' | 'category' | 'messageStatus', value: string) {
    const index = this.selectedFilters[key].indexOf(value);

    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }
  }

  resetFilters() {
    this.selectedFilters = {
      status: [],
      priority: [],
      lowRemaining: false,
      category: [],
      messageStatus: [],
    };
  }

  // =========================
  // 套用篩選
  // =========================

  applyFilters(resetPage: boolean = true) {
    this.filteredDemands = this.demands.filter((item) => {
      // 關鍵字
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        const term = this.searchTerm.trim().toLowerCase();


        const matchCategory = item.type ? item.type.toLowerCase().includes(term) : false;

        if (!matchCategory) {
          return false;
        }
      }

      // 上架狀態
      if (this.selectedFilters.status.length > 0 && !this.selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      // 優先度
      if (this.selectedFilters.priority.length > 0 && !this.selectedFilters.priority.includes(item.priority)) {
        return false;
      }
      // 類別
      if (this.selectedFilters.category.length > 0 && (!item.type || !this.selectedFilters.category.includes(item.type))) {
        return false;
      }

      // 留言狀態
      if (this.selectedFilters.messageStatus.length > 0) {
        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = this.selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = this.selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        if (wantsNotReplied && !wantsReplied && hasMsg) {
          return false;
        }
      }

      return true;
    });

    if (resetPage) {
      this.currentPage = 1;
    }

    if (this.userHasSorted) {
      this.applySort();
    } else {
      this.updatePagination();
    }

    this.closeFilterModal();
  }

  // =========================
  // 排序
  // =========================

  private getCreatedAtTime(demand: VolunteerDemand): number {
    if (demand.status === '隱藏' || !demand.createdAt) {
      return Number.POSITIVE_INFINITY;
    }

    const timestamp = new Date(demand.createdAt).getTime();

    return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
  }

  applySort() {
    this.filteredDemands.sort((a, b) => {
      let result = 0;

      if (this.selectedSort === 'createdAt') {
        const aTime = this.getCreatedAtTime(a);
        const bTime = this.getCreatedAtTime(b);

        result = aTime - bTime;
      }

      if (this.selectedSort === 'amount') {
        result = Number(a.people ?? 0) - Number(b.people ?? 0);
      }

      return this.sortAscending ? result : -result;
    });

    this.updatePagination();
  }

  // =========================
  // 分頁
  // =========================

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredDemands.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.pageNumbers = Array.from(
      {
        length: this.totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.pagedDemands = this.filteredDemands.slice(startIndex, endIndex);

    this.selectAll = this.pagedDemands.length > 0 && this.pagedDemands.every((item) => item.selected);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;

      this.updatePagination();
    }
  }

  // =========================
  // 刪除
  // =========================

  openDeleteModal(id: number) {
    this.deleteIds = [id];

    this.deleteType = 'single';

    this.showDeleteModal = true;
  }

  openBatchDeleteModal() {
    this.deleteIds = this.filteredDemands.filter((item) => item.selected && item.id !== undefined).map((item) => item.id as number);

    this.deleteType = 'batch';

    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  onDeleted() {
    this.showDeleteModal = false;

    this.deleteIds = [];

    this.selectAll = false;

    this.loadDemands();
  }

  // =========================
  // 修改狀態
  // =========================

  changeStatus(
    item:VolunteerDemand & {
      selected: boolean;
      displayStatus: DisplayVolunteerStatus;
      displayCreatedAt: string;
    }
  ) {
    let status: VolunteerStatus;

    switch (item.displayStatus) {
      case '已上架':
        status = '上架';
        break;

      case '隱藏中':
        status = '隱藏';
        break;

      case '已下架':
        status = '下架';
        break;

      default:
        status = '上架';
    }

    item.status = status;

    if (status === '隱藏') {
      item.displayCreatedAt = '尚未發布';
    }

    if (status === '上架' || status === '下架') {
      item.displayCreatedAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '尚未發布';
    }

    this.disasterDemandService.updateDemand(item);
  }
}
