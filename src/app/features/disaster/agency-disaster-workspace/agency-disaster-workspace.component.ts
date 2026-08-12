import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DisasterDemandService } from '../../../components/core/services/disaster-demand.service';

import {
  DisasterDemand,
  DisasterStatus,
  DisplayStatus
} from '../../../models/agency/demand';

import {
  VolunteerDemandService,
  VolunteerDemand
} from '../../../components/core/services/volunteer-demand.service';


// ======================================================
// 物資排序類型
// ======================================================

type SortType =
  | 'createdAt'
  | 'amount'
  | 'remaining';


// ======================================================
// 志工排序類型
// ======================================================

type VolunteerSortType =
  | 'createdAt'
  | 'people';


// ======================================================
// Component
// ======================================================

@Component({
  selector: 'app-agency-disaster-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent
  implements OnInit {


  // ======================================================
  // 物資需求
  // ======================================================

  demands: (
    DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
      displayCreatedAt: string;
    }
  )[] = [];


  filteredDemands: (
    DisasterDemand & {
      selected: boolean;
      displayStatus: DisplayStatus;
      displayCreatedAt: string;
    }
  )[] = [];


  selectAll = false;


  // ======================================================
  // 志工需求
  // ======================================================

  volunteerDemands: (
    VolunteerDemand & {
      selected: boolean;
      displayCreatedAt: string;
      displayStatus:
        | '已上架'
        | '隱藏中'
        | '已下架';
    }
  )[] = [];


  filteredVolunteerDemands: (
    VolunteerDemand & {
      selected: boolean;
      displayCreatedAt: string;
      displayStatus:
        | '已上架'
        | '隱藏中'
        | '已下架';
    }
  )[] = [];


  // 志工全選
  volunteerSelectAll = false;


  // ======================================================
  // 物資排序
  // ======================================================

  selectedSort: SortType = 'createdAt';

  sortAscending = true;

  isSortDropdownOpen = false;


  sortOptions: {
    label: string;
    value: SortType;
  }[] = [

    {
      label: '發布時間',
      value: 'createdAt'
    },

    {
      label: '需求數量',
      value: 'amount'
    },

    {
      label: '剩餘需求',
      value: 'remaining'
    }

  ];


  // ======================================================
  // 志工排序
  // ======================================================

  volunteerSelectedSort:
    VolunteerSortType = 'createdAt';

  volunteerSortAscending = true;

  volunteerSortDropdownOpen = false;


  volunteerSortOptions: {
    label: string;
    value: VolunteerSortType;
  }[] = [

    {
      label: '發布時間',
      value: 'createdAt'
    },

    {
      label: '需求人數',
      value: 'people'
    }

  ];


  // ======================================================
  // 刪除 Modal
  // ======================================================

  showDeleteModal = false;

  deleteId!: number;

  deleteType:
    | 'single'
    | 'batch' = 'single';


  // ======================================================
  // 物資篩選
  // ======================================================

  showFilterModal = false;


  statusOptions: DisplayStatus[] = [
    '已上架',
    '隱藏中',
    '已下架'
  ];


  priorityOptions:
    DisasterDemand['priority'][] = [
      '普通',
      '緊急',
      '非常緊急'
    ];


  categoryOptions:
    NonNullable<
      DisasterDemand['category']
    >[] = [
      '食物',
      '衣物',
      '醫療',
      '嬰幼兒',
      '生活用品',
      '其他'
    ];


  messageOptions = [
    '已回覆',
    '未回覆'
  ];


  selectedFilters = {

    status: [] as string[],

    priority: [] as string[],

    lowRemaining: false,

    category: [] as string[],

    messageStatus: [] as string[]

  };


  // ======================================================
  // 志工篩選 Modal
  // ======================================================

  showVolunteerFilterModal = false;


  // ======================================================
  // Constructor
  // ======================================================

  constructor(

    private disasterDemandService:
      DisasterDemandService,

    private volunteerDemandService:
      VolunteerDemandService,

    private router: Router

  ) {}


  // ======================================================
  // 初始化
  // ======================================================

  ngOnInit(): void {

    this.loadDemands();

    this.loadVolunteerDemands();

  }


  // ======================================================
  // 點擊其他地方關閉物資排序
  // ======================================================

  @HostListener('document:click')
  closeSortDropdown(): void {

    this.isSortDropdownOpen = false;

    this.volunteerSortDropdownOpen = false;

  }


  // ======================================================
  // ==================== 物資列表 =========================
  // ======================================================


  // ------------------------------------------------------
  // 載入物資
  // ------------------------------------------------------

  loadDemands(): void {

    this.demands =
      this.disasterDemandService
        .getDemands()
        .map((item) => {

          let currentStatus:
            DisplayStatus = '已上架';


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
              item.createdAt
                ? new Date(
                    item.createdAt
                  ).toLocaleDateString('zh-TW')
                : '尚未發布',

            remaining:
              item.remaining ??
              item.amount ??
              0,

            category:
              item.category ??
              '其他'

          };

        });


    this.applyFilters();

  }


  // ------------------------------------------------------
  // 物資全選
  // ------------------------------------------------------

  toggleAll(): void {

    this.filteredDemands.forEach(
      (item) => {

        item.selected =
          this.selectAll;

      }
    );

  }


  // ------------------------------------------------------
  // 是否有選取物資
  // ------------------------------------------------------

  hasSelected(): boolean {

    return this.filteredDemands.some(
      (item) => item.selected
    );

  }


  // ------------------------------------------------------
  // 批次編輯物資
  // ------------------------------------------------------

  editSelected(): void {

    const selectedItems =
      this.filteredDemands.filter(
        (item) => item.selected
      );


    if (
      selectedItems.length === 0
    ) {

      alert(
        '請先選擇要修改的需求'
      );

      return;

    }


    localStorage.setItem(
      'editDemands',
      JSON.stringify(selectedItems)
    );


    this.router.navigate([
      '/agency/supply-batch-edit'
    ]);

  }


  // ======================================================
  // 物資排序
  // ======================================================

  toggleSortDropdown(): void {

    this.isSortDropdownOpen =
      !this.isSortDropdownOpen;

  }


  toggleSortOrder(): void {

    this.sortAscending =
      !this.sortAscending;

    this.applySort();

  }


  getSelectedSortLabel(): string {

    const found =
      this.sortOptions.find(
        (opt) =>
          opt.value ===
          this.selectedSort
      );


    return found
      ? found.label
      : '發布時間';

  }


  selectSortOption(
    value: SortType
  ): void {

    this.selectedSort = value;

    this.isSortDropdownOpen =
      false;

    this.applySort();

  }


  applySort(): void {

    this.filteredDemands.sort(
      (a, b) => {

        let result = 0;


        if (
          this.selectedSort ===
          'createdAt'
        ) {

          const aTime =
            a.createdAt
              ? new Date(
                  a.createdAt
                ).getTime()
              : 0;


          const bTime =
            b.createdAt
              ? new Date(
                  b.createdAt
                ).getTime()
              : 0;


          result =
            aTime - bTime;

        }


        if (
          this.selectedSort ===
          'amount'
        ) {

          result =
            Number(a.amount ?? 0) -
            Number(b.amount ?? 0);

        }


        if (
          this.selectedSort ===
          'remaining'
        ) {

          result =
            Number(a.remaining ?? 0) -
            Number(b.remaining ?? 0);

        }


        return this.sortAscending
          ? result
          : -result;

      }
    );

  }


  // ======================================================
  // 物資篩選
  // ======================================================

  openFilterModal(): void {

    this.showFilterModal =
      true;

  }


  closeFilterModal(): void {

    this.showFilterModal =
      false;

  }


  toggleFilter(
    key:
      | 'status'
      | 'priority'
      | 'category'
      | 'messageStatus',

    value: string
  ): void {

    const index =
      this.selectedFilters[key]
        .indexOf(value);


    if (index > -1) {

      this.selectedFilters[key]
        .splice(index, 1);

    } else {

      this.selectedFilters[key]
        .push(value);

    }

  }


  resetFilters(): void {

    this.selectedFilters = {

      status: [],

      priority: [],

      lowRemaining: false,

      category: [],

      messageStatus: []

    };

    this.applyFilters();

  }


  applyFilters(): void {

    this.filteredDemands =
      this.demands.filter(
        (item) => {


          // 狀態

          if (

            this.selectedFilters.status
              .length > 0 &&

            !this.selectedFilters.status
              .includes(
                item.displayStatus
              )

          ) {

            return false;

          }


          // 優先度

          if (

            this.selectedFilters.priority
              .length > 0 &&

            !this.selectedFilters.priority
              .includes(
                item.priority
              )

          ) {

            return false;

          }


          // 剩餘數量

          if (

            this.selectedFilters
              .lowRemaining &&

            Number(
              item.remaining ?? 0
            ) <= 0

          ) {

            return false;

          }


          // 類別

          if (

            this.selectedFilters.category
              .length > 0 &&

            (
              !item.category ||

              !this.selectedFilters.category
                .includes(
                  item.category
                )
            )

          ) {

            return false;

          }


          // 留言

          if (

            this.selectedFilters
              .messageStatus
              .length > 0

          ) {

            const hasMsg =
              (item.messageCount || 0) >
              0;


            const wantsReplied =
              this.selectedFilters
                .messageStatus
                .includes(
                  '已回覆'
                );


            const wantsNotReplied =
              this.selectedFilters
                .messageStatus
                .includes(
                  '未回覆'
                );


            if (
              wantsReplied &&
              !wantsNotReplied &&
              !hasMsg
            ) {

              return false;

            }


            if (
              wantsNotReplied &&
              !wantsReplied &&
              hasMsg
            ) {

              return false;

            }

          }


          return true;

        }
      );


    this.applySort();

  }


  // ======================================================
  // 物資刪除
  // ======================================================

  openDeleteModal(
    id: number
  ): void {

    this.deleteId = id;

    this.deleteType =
      'single';

    this.showDeleteModal =
      true;

  }


  openBatchDeleteModal(): void {

    this.deleteType =
      'batch';

    this.showDeleteModal =
      true;

  }


  closeDeleteModal(): void {

    this.showDeleteModal =
      false;

  }


  confirmDelete(): void {

    if (
      this.deleteType ===
      'single'
    ) {

      this.disasterDemandService
        .deleteDemand(
          this.deleteId
        );

    } else {

      const ids =
        this.filteredDemands

          .filter(
            (item) =>
              item.selected &&
              item.id !== undefined
          )

          .map(
            (item) =>
              item.id as number
          );


      ids.forEach(
        (id) => {

          this.disasterDemandService
            .deleteDemand(id);

        }
      );


      this.selectAll =
        false;

    }


    this.loadDemands();

    this.closeDeleteModal();

  }


  // ======================================================
  // 物資狀態修改
  // ======================================================

  changeStatus(
    item: DisasterDemand & {

      selected: boolean;

      displayStatus:
        DisplayStatus;

    }
  ): void {

    let status:
      DisasterStatus;


    switch (
      item.displayStatus
    ) {

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


    item.status =
      status;


    if (
      status ===
      '隱藏'
    ) {

      item.createdAt =
        undefined;

    }


    if (
      status ===
      '上架' &&
      !item.createdAt
    ) {

      item.createdAt =
        new Date().toISOString();

    }


    this.disasterDemandService
      .updateDemand(item);


    this.loadDemands();

  }


  // ======================================================
  // ==================== 志工列表 =========================
  // ======================================================


  // ------------------------------------------------------
  // 載入志工
  // ------------------------------------------------------

  loadVolunteerDemands(): void {

    this.volunteerDemands =
      this.volunteerDemandService
        .getDemands()
        .map((item) => {


          let displayStatus:
            | '已上架'
            | '隱藏中'
            | '已下架'
            = '已上架';


          if (
            item.status ===
            '已上架'
          ) {

            displayStatus =
              '已上架';

          }


          if (
            item.status ===
            '隱藏中'
          ) {

            displayStatus =
              '隱藏中';

          }


          if (
            item.status ===
            '已下架'
          ) {

            displayStatus =
              '已下架';

          }


          return {

            ...item,

            selected: false,

            displayStatus,

            displayCreatedAt:
              item.createdAt
                ? new Date(
                    item.createdAt
                  ).toLocaleDateString(
                    'zh-TW'
                  )
                : '尚未發布'

          };

        });


    this.filteredVolunteerDemands =
      [
        ...this.volunteerDemands
      ];


    this.applyVolunteerSort();

  }


  // ======================================================
  // 志工全選
  // ======================================================

  toggleVolunteerAll(): void {

    this.filteredVolunteerDemands
      .forEach(
        (item) => {

          item.selected =
            this.volunteerSelectAll;

        }
      );

  }


  // ======================================================
  // 志工是否有選取
  // ======================================================

  hasSelectedVolunteer(): boolean {

    return this.filteredVolunteerDemands
      .some(
        (item) =>
          item.selected
      );

  }


  // ======================================================
  // 志工批次編輯
  // ======================================================

  editSelectedVolunteer(): void {

    const selectedItems =
      this.filteredVolunteerDemands
        .filter(
          (item) =>
            item.selected
        );


    if (
      selectedItems.length ===
      0
    ) {

      alert(
        '請先選擇要修改的志工需求'
      );

      return;

    }


    localStorage.setItem(
      'editVolunteerDemands',
      JSON.stringify(
        selectedItems
      )
    );


    alert(
      `已選擇 ${selectedItems.length} 筆志工需求`
    );

  }


  // ======================================================
  // 志工批次刪除
  // ======================================================

  deleteSelectedVolunteer(): void {

    const selectedItems =
      this.filteredVolunteerDemands
        .filter(
          (item) =>
            item.selected
        );


    if (
      selectedItems.length ===
      0
    ) {

      alert(
        '請先選擇要刪除的志工需求'
      );

      return;

    }


    const result =
      confirm(
        `確定要刪除選取的 ${selectedItems.length} 筆志工需求嗎？`
      );


    if (!result) {

      return;

    }


    selectedItems.forEach(
      (item) => {

        this.volunteerDemandService
          .deleteDemand(
            item.id
          );

      }
    );


    this.volunteerSelectAll =
      false;


    this.loadVolunteerDemands();

  }


  // ======================================================
  // 志工單筆刪除
  // ======================================================

  deleteVolunteer(
    id: number
  ): void {

    const result =
      confirm(
        '確定要刪除這筆志工需求嗎？'
      );


    if (!result) {

      return;

    }


    this.volunteerDemandService
      .deleteDemand(id);


    this.loadVolunteerDemands();

  }


  // ======================================================
  // 志工排序
  // ======================================================

  toggleVolunteerSortOrder(): void {

    this.volunteerSortAscending =
      !this.volunteerSortAscending;


    this.applyVolunteerSort();

  }


  toggleVolunteerSortDropdown(): void {

    this.volunteerSortDropdownOpen =
      !this.volunteerSortDropdownOpen;

  }


  getVolunteerSortLabel(): string {

    const found =
      this.volunteerSortOptions.find(
        (opt) =>
          opt.value ===
          this.volunteerSelectedSort
      );


    return found
      ? found.label
      : '發布時間';

  }


  selectVolunteerSort(
    value: VolunteerSortType
  ): void {

    this.volunteerSelectedSort =
      value;


    this.volunteerSortDropdownOpen =
      false;


    this.applyVolunteerSort();

  }


  applyVolunteerSort(): void {

    this.filteredVolunteerDemands
      .sort(
        (a, b) => {

          let result = 0;


          if (
            this.volunteerSelectedSort ===
            'createdAt'
          ) {

            const aTime =
              a.createdAt
                ? new Date(
                    a.createdAt
                  ).getTime()
                : 0;


            const bTime =
              b.createdAt
                ? new Date(
                    b.createdAt
                  ).getTime()
                : 0;


            result =
              aTime - bTime;

          }


          if (
            this.volunteerSelectedSort ===
            'people'
          ) {

            result =
              Number(
                a.people ?? 0
              ) -
              Number(
                b.people ?? 0
              );

          }


          return this.volunteerSortAscending
            ? result
            : -result;

        }
      );

  }


  // ======================================================
  // 志工篩選
  // ======================================================

  openVolunteerFilterModal(): void {

    this.showVolunteerFilterModal =
      true;

  }


  closeVolunteerFilterModal(): void {

    this.showVolunteerFilterModal =
      false;

  }


  // ======================================================
  // 志工狀態修改
  // ======================================================

  changeVolunteerStatus(
    item: VolunteerDemand & {

      selected: boolean;

      displayCreatedAt: string;

      displayStatus:
        | '已上架'
        | '隱藏中'
        | '已下架';

    }
  ): void {

    item.status =
      item.displayStatus;


    this.volunteerDemandService
      .updateDemand(item);


    this.loadVolunteerDemands();

  }

}
