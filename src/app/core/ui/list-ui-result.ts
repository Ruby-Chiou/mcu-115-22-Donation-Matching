/** 列表 Logic → Component 的 UI 意圖（SRP：domain 不直接操作 DOM／alert）。 */
export interface ListUiResult {
  notice?: string;
  scrollTop?: boolean;
  preserveScrollY?: boolean;
  openDeleteModal?: boolean;
  closeDeleteModal?: boolean;
  openOffShelfWarning?: boolean;
  closeOffShelfWarning?: boolean;
  openOnShelfWarning?: boolean;
  closeOnShelfWarning?: boolean;
  openFilterModal?: boolean;
  closeFilterModal?: boolean;
  navigateTo?: unknown[];
  selectValueRestore?: string;
  restoreScrollY?: number | null;
}
