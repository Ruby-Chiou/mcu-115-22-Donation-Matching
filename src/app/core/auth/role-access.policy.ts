import { Injectable } from '@angular/core';

import { AppRole, AuthPrincipal } from '../../models/auth/app-role';

export type AccessDecision = 'allow' | 'login' | 'home';

const DONOR_PRIVATE_PREFIXES = [
  '/donor/daily/form',
  '/donor/disaster/supply/form',
  '/donor/disaster/helper/form',
  '/donor/history',
  '/tracking',
];

/**
 * 頁面可見範圍的單一規則表。
 * 新增受保護路徑時只改這裡，路由守衛與捐物按鈕都問同一份決定。
 */
@Injectable({
  providedIn: 'root',
})
export class RoleAccessPolicy {
  canActivate(role: AppRole, url: string): boolean {
    const path = normalizePath(url);

    if (isPrefix(path, '/admin')) {
      return role === 'admin';
    }

    if (isPrefix(path, '/agency')) {
      return role === 'agency';
    }

    if (isPrefix(path, '/member')) {
      return role !== 'guest';
    }

    if (DONOR_PRIVATE_PREFIXES.some((prefix) => isPrefix(path, prefix))) {
      return role === 'donor';
    }

    return true;
  }

  decide(role: AppRole, url: string): AccessDecision {
    if (this.canActivate(role, url)) {
      return 'allow';
    }

    return role === 'guest' ? 'login' : 'home';
  }

  /** 登入完成、且沒有可回去的頁面時，各身分的起點。 */
  home(role: AppRole): string {
    if (role === 'admin') {
      return '/admin/dashboard';
    }

    if (role === 'agency') {
      return '/agency/dashboard';
    }

    return '/home';
  }
}

function normalizePath(url: string): string {
  const withoutHash = url.split('#')[0] ?? '';
  const path = withoutHash.split('?')[0] || '/';

  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

export function isDonorPrivatePath(url: string): boolean {
  const path = normalizePath(url);
  return DONOR_PRIVATE_PREFIXES.some((prefix) => isPrefix(path, prefix));
}

/** 個人捐助者可直接捐助。公司要等管理者審核通過。 */
export function donorActionsOpen(principal: AuthPrincipal): boolean {
  if (principal.role !== 'donor') {
    return false;
  }

  if (principal.donorKind === 'company') {
    return principal.companyStatus === 'approved';
  }

  return true;
}

function isPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}
