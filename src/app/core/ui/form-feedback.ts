/** Logic → Component 的輕量回饋契約（SRP：domain 不直接操作 UI）。 */

export interface FormNoticeResult {
  notice?: string;
}

export interface FormScrollResult extends FormNoticeResult {
  scrollSelector?: string;
  scrollTop?: boolean;
}
