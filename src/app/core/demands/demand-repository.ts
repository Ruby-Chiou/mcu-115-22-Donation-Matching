/** 日常、災害物資、協力需求共用的讀寫入口。各服務仍可保留自己的額外方法。 */
export interface DemandRepository<T> {
  waitUntilLoaded(): Promise<void>;
  reload(): Promise<void>;
  getDemands(): T[];
  getDemandById(id: number): Promise<T | undefined>;
  deleteDemand(id: number): Promise<void>;
}
