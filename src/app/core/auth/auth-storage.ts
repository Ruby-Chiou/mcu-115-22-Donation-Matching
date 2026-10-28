const PERSIST_KEY = 'dm-auth-persist';
const OAUTH_PERSIST_KEY = 'dm-auth-oauth';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined';
}

/** 勾選記住我，或第三方登入進行中時，工作階段改放 localStorage，避免換分頁／App 內瀏覽器回站後遺失。 */
function activeStore(): Storage {
  if (localStorage.getItem(PERSIST_KEY) === '1' || localStorage.getItem(OAUTH_PERSIST_KEY) === '1') {
    return localStorage;
  }

  return sessionStorage;
}

export function setAuthPersistence(remember: boolean): void {
  if (!canUseStorage()) {
    return;
  }

  if (remember) {
    localStorage.setItem(PERSIST_KEY, '1');
    return;
  }

  localStorage.removeItem(PERSIST_KEY);
}

/** 第三方登入離開前呼叫；回站並套用工作階段後再 clearOAuthPersistence。 */
export function beginOAuthPersistence(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(OAUTH_PERSIST_KEY, '1');
}

export function clearOAuthPersistence(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(OAUTH_PERSIST_KEY);
}

export const authStorage = {
  getItem(key: string): string | null {
    if (!canUseStorage()) {
      return null;
    }

    return activeStore().getItem(key);
  },

  setItem(key: string, value: string): void {
    if (!canUseStorage()) {
      return;
    }

    const store = activeStore();
    const other = store === localStorage ? sessionStorage : localStorage;
    other.removeItem(key);
    store.setItem(key, value);
  },

  removeItem(key: string): void {
    if (!canUseStorage()) {
      return;
    }

    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};
