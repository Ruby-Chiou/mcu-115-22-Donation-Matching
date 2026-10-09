import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';
import { DisasterDemand, DisasterStatus, DisplayStatus } from '../../../models/agency/disaster-demand';
import { SupplyFilterState } from '../../filter/supply-filter/supply-filter.component';
import { SortType } from '../../sort-bar/supply-sort-bar/supply-sort-bar.component';
import { DisasterCommentService } from '../../../core/services/comments/disaster-comment.service';

export type DisasterListItem = DisasterDemand & {
  selected: boolean;
  displayStatus: DisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

export class DisasterListLogic {
  mapDemands(demands: DisasterDemand[], disasterDemandService: DisasterDemandService): DisasterListItem[] {
    const displayStatus: Record<DisasterStatus, DisplayStatus> = {
      上架: '已上架',
      隱藏: '隱藏中',
      下架: '已下架',
    };

    return demands.map((item) => {
      const checkedItem = this.checkNaturalOffShelf(item, disasterDemandService);

      return {
        ...checkedItem,
        selected: false,
        displayStatus: displayStatus[checkedItem.status],
        displayCreatedAt: checkedItem.createdAt ? new Date(checkedItem.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
        displayPublishedAt: checkedItem.publishedAt ? new Date(checkedItem.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',
        displayOffShelfAt: checkedItem.expectedOffShelfAt ? new Date(checkedItem.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
        remaining: checkedItem.remaining ?? checkedItem.amount ?? 0,
        category: checkedItem.category ?? '其他',
      };
    });
  }

  async loadMessageCounts(demands: DisasterListItem[], disasterCommentService: DisasterCommentService): Promise<DisasterListItem[]> {
    const result = await Promise.all(
      demands.map(async (item) => {
        if (item.id == null) {
          return {
            ...item,
            messageCount: 0,
          };
        }

        const messageCount = await disasterCommentService.getCommentCount(item.id);

        return {
          ...item,
          messageCount,
        };
      })
    );

    return result;
  }

  /**
   * 檢查需求是否已經超過預計下架時間
   */
  checkNaturalOffShelf(item: DisasterDemand, disasterDemandService: DisasterDemandService): DisasterDemand {
    if (item.status !== '上架') {
      return item;
    }

    if (!item.expectedOffShelfAt) {
      return item;
    }

    const now = new Date();
    const expectedOffShelfAt = new Date(item.expectedOffShelfAt);

    if (now >= expectedOffShelfAt) {
      item.status = '下架';
      item.offShelfReason = 'natural';

      // 同步更新 Service 中的資料
      disasterDemandService.updateDemand(item);
    }

    return item;
  }

  /**
   * 套用搜尋與篩選條件
   */
  filterDemands(demands: DisasterListItem[], searchTerm: string, selectedFilters: SupplyFilterState): DisasterListItem[] {
    return demands.filter((item) => {
      // 搜尋
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();

        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;

        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      // 狀態篩選
      if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      // 優先度篩選
      if (selectedFilters.priority.length > 0 && !selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      // 剩餘需求篩選
      if (selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      // 類別篩選
      if (selectedFilters.category.length > 0 && (!item.category || !selectedFilters.category.includes(item.category))) {
        return false;
      }

      // 留言狀態篩選
      if (selectedFilters.messageStatus.length > 0) {
        // 留言篩選只套用在「已上架」
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = selectedFilters.messageStatus.includes('未回覆');

        // 有回覆 → 留言數大於 0
        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        // 未回覆 → 留言數等於 0
        if (wantsNotReplied && !wantsReplied && hasMsg) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 套用排序
   */
  sortDemands(demands: DisasterListItem[], selectedSort: SortType, sortAscending: boolean): DisasterListItem[] {
    return [...demands].sort((a, b) => {
      let result = 0;

      if (selectedSort === 'serialNo') {
        result = Number(a.serialNo ?? 0) - Number(b.serialNo ?? 0);
      }

      if (selectedSort === 'createdAt') {
        result = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      }

      if (selectedSort === 'publishedAt') {
        result = new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
      }

      if (selectedSort === 'expectedOffShelfAt') {
        result = new Date(a.expectedOffShelfAt ?? 0).getTime() - new Date(b.expectedOffShelfAt ?? 0).getTime();
      }

      if (selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      return sortAscending ? result : -result;
    });
  }

  /**
   * 計算分頁資料
   */
  getPaginationData(
    filteredDemands: DisasterListItem[],
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    pageNumbers: number[];
    pagedDemands: DisasterListItem[];
    currentPage: number;
    selectAll: boolean;
  } {
    const totalPages = Math.ceil(filteredDemands.length / pageSize) || 1;

    let adjustedCurrentPage = currentPage;

    if (adjustedCurrentPage > totalPages) {
      adjustedCurrentPage = totalPages;
    }

    const pageNumbers = Array.from(
      {
        length: totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (adjustedCurrentPage - 1) * pageSize;

    const pagedDemands = [...filteredDemands.slice(startIndex, startIndex + pageSize)];

    const selectAll = pagedDemands.length > 0 && pagedDemands.every((item) => item.selected);

    return {
      totalPages,
      pageNumbers,
      pagedDemands,
      currentPage: adjustedCurrentPage,
      selectAll,
    };
  }

  /**
   * 計算預計下架日期
   */
  calculateExpectedOffShelfDate(publishedDate: Date, priority: DisasterDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 7);
        break;
    }

    return offShelfDate.toISOString();
  }

  /**
   * 套用需求狀態變更
   */
  async applyStatusChange(item: DisasterListItem, disasterDemandService: DisasterDemandService): Promise<void> {
    const originalItem = disasterDemandService.getDemands().find((demand) => demand.id === item.id);

    const originalStatus = originalItem?.status;

    const status: DisasterStatus = item.displayStatus === '已上架' ? '上架' : '隱藏';

    const now = new Date();

    if (status === '上架') {
      if (originalStatus !== '上架') {
        item.publishedAt = now.toISOString();
        item.createdAt ??= now.toISOString();
      }

      if (item.publishedAt) {
        item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
      }

      item.status = '上架';
      item.offShelfReason = undefined;
      item.displayStatus = '已上架';

      item.displayPublishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-TW') : '尚未上架';

      item.displayOffShelfAt = item.expectedOffShelfAt ? new Date(item.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—';
    } else {
      item.status = '隱藏';
      item.publishedAt = undefined;
      item.expectedOffShelfAt = undefined;
      item.displayStatus = '隱藏中';
      item.displayPublishedAt = '尚未上架';
      item.displayOffShelfAt = '—';
    }

    try {
      await disasterDemandService.updateDemand(item);
    } catch (error) {
      console.error('狀態更新失敗：', error);
    }
  }
}
