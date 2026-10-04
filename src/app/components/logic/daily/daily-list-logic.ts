import { DailyDemand, DailyDisplayStatus } from '../../../models/agency/daily-demand';

export type ReceiveMethod = '寄送' | '面交';
export type DailyFilterState = {
  status: string[];
  priority: string[];
  receiveMethod: ReceiveMethod[];
  lowRemaining: boolean;
  category: string[];
  messageStatus: string[];
};

export type DailyListItem = DailyDemand & {
  selected: boolean;
  displayStatus: DailyDisplayStatus;
  displayCreatedAt: string;
  displayPublishedAt: string;
  displayOffShelfAt: string;
};

export class DailyListLogic {
  checkNaturalOffShelf(item: DailyDemand, updateDemand: (item: DailyDemand) => void): DailyDemand {
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
      updateDemand(item);
    }

    return item;
  }

  mapDemands(data: DailyDemand[], updateDemand: (item: DailyDemand) => void): DailyListItem[] {
    return data.map((item) => {
      const checkedItem = this.checkNaturalOffShelf(item, updateDemand);

      let displayStatus: DailyDisplayStatus;

      switch (checkedItem.status) {
        case '上架':
          displayStatus = '已上架';
          break;

        case '隱藏':
          displayStatus = '隱藏中';
          break;

        case '下架':
          displayStatus = '已下架';
          break;

        default:
          displayStatus = '隱藏中';
          break;
      }

      return {
        ...checkedItem,
        selected: false,
        displayStatus,
        displayCreatedAt: checkedItem.createdAt ? new Date(checkedItem.createdAt).toLocaleDateString('zh-TW') : '尚未建立',
        displayPublishedAt: checkedItem.publishedAt ? new Date(checkedItem.publishedAt).toLocaleDateString('zh-TW') : '尚未上架',
        displayOffShelfAt: checkedItem.expectedOffShelfAt ? new Date(checkedItem.expectedOffShelfAt).toLocaleDateString('zh-TW') : '—',
        remaining: checkedItem.remaining ?? checkedItem.amount ?? 0,
        category: checkedItem.category ?? '其他',
      };
    });
  }

  filterDemands(demands: DailyListItem[], searchTerm: string, selectedFilters: DailyFilterState): DailyListItem[] {
    return demands.filter((item) => {
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();

        const matchItem = item.item ? item.item.toLowerCase().includes(term) : false;

        const matchCategory = item.category ? item.category.toLowerCase().includes(term) : false;

        if (!matchItem && !matchCategory) {
          return false;
        }
      }

      if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(item.displayStatus)) {
        return false;
      }

      if (selectedFilters.priority.length > 0 && !selectedFilters.priority.includes(item.priority)) {
        return false;
      }

      if (selectedFilters.receiveMethod.length > 0) {
        const selectedMethods = selectedFilters.receiveMethod;

        const matchReceiveMethod = selectedMethods.some((method) => {
          return item.receiveMethod?.[method] === true;
        });

        if (!matchReceiveMethod) {
          return false;
        }
      }

      if (selectedFilters.lowRemaining && Number(item.remaining ?? 0) <= 0) {
        return false;
      }

      if (selectedFilters.category.length > 0 && (!item.category || !selectedFilters.category.includes(item.category))) {
        return false;
      }

      if (selectedFilters.messageStatus.length > 0) {
        if (item.displayStatus !== '已上架') {
          return false;
        }

        const hasMsg = (item.messageCount || 0) > 0;

        const wantsReplied = selectedFilters.messageStatus.includes('已回覆');

        const wantsNotReplied = selectedFilters.messageStatus.includes('未回覆');

        if (wantsReplied && !wantsNotReplied && !hasMsg) {
          return false;
        }

        if (wantsNotReplied && !wantsReplied && hasMsg) {
          return false;
        }
      }

      return true;
    });
  }

  sortDemands(demands: DailyListItem[], selectedSort: string, sortAscending: boolean): DailyListItem[] {
    demands.sort((a, b) => {
      let result = 0;

      if (selectedSort === 'serialNo') {
        result = a.serialNo - b.serialNo;
      }

      if (selectedSort === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();

        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();

        result = aTime - bTime;
      }

      if (selectedSort === 'amount') {
        result = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }

      if (selectedSort === 'remaining') {
        result = Number(a.remaining ?? 0) - Number(b.remaining ?? 0);
      }

      if (selectedSort === 'publishedAt') {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;

        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

        result = aTime - bTime;
      }

      if (selectedSort === 'expectedOffShelfAt') {
        const aTime = a.expectedOffShelfAt ? new Date(a.expectedOffShelfAt).getTime() : 0;

        const bTime = b.expectedOffShelfAt ? new Date(b.expectedOffShelfAt).getTime() : 0;

        result = aTime - bTime;
      }

      return sortAscending ? result : -result;
    });

    return demands;
  }

  getPaginationData(
    filteredDemands: DailyListItem[],
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    currentPage: number;
    pageNumbers: number[];
    pagedDemands: DailyListItem[];
    selectAll: boolean;
  } {
    const totalPages = Math.ceil(filteredDemands.length / pageSize) || 1;

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageNumbers = Array.from(
      {
        length: totalPages,
      },
      (_, i) => i + 1
    );

    const startIndex = (currentPage - 1) * pageSize;

    const endIndex = startIndex + pageSize;

    const pagedDemands = filteredDemands.slice(startIndex, endIndex);

    const selectAll = pagedDemands.length > 0 && pagedDemands.every((item) => item.selected);

    return {
      totalPages,
      currentPage,
      pageNumbers,
      pagedDemands,
      selectAll,
    };
  }

  calculateExpectedOffShelfDate(publishedDate: Date, priority: DailyDemand['priority']): string {
    const offShelfDate = new Date(publishedDate);

    switch (priority) {
      case '普通':
        offShelfDate.setDate(offShelfDate.getDate() + 60);
        break;

      case '緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 30);
        break;

      case '非常緊急':
        offShelfDate.setDate(offShelfDate.getDate() + 14);
        break;
    }

    return offShelfDate.toISOString();
  }
}
