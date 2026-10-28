const PERSIST_KEY = 'dm-auth-persist';
const OAUTH_PERSIST_KEY = 'dm-auth-oauth';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined';
}

/** 勾選記住我，或第三方登入進行中／完成後，工作階段放 localStorage。 */
function activeStore(): Storage {
  if (localStorage.getItem(PERSIST_KEY) === '1' || localStorage.getItem(OAUTH_PERSIST_KEY) === '1') {
    return localStorage;
  }

  return sessionStorage;
}

function otherStore(store: Storage): Storage {
  return store === localStorage ? sessionStorage : localStorage;
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

/** 第三方登入離開前呼叫：PKCE 與回來的 session 都進 localStorage。 */
export function beginOAuthPersistence(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(OAUTH_PERSIST_KEY, '1');
  // 第三方登入視為需跨重整保留；否則清掉 oauth 標記後會改讀 sessionStorage 而找不到票。
  localStorage.setItem(PERSIST_KEY, '1');
}

/** 回站並套用工作階段後呼叫；保留記住我，只清掉進行中標記。 */
export function clearOAuthPersistence(): void {
  if (!canUseStorage()) {
    return;
  }

  migrateAuthKeysTo(localStorage);
  localStorage.setItem(PERSIST_KEY, '1');
  localStorage.removeItem(OAUTH_PERSIST_KEY);
}

/** 把 dm-auth 相關鍵從另一個 store 併到目標，避免標記切換後讀不到。 */
function migrateAuthKeysTo(target: Storage): void {
  const source = otherStore(target);
  const keys: string[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const key = source.key(index);
    if (key?.startsWith('dm-auth')) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    const value = source.getItem(key);
    if (value == null) {
      continue;
    }

    if (target.getItem(key) == null) {
      target.setItem(key, value);
    }
    source.removeItem(key);
  }
}

export const authStorage = {
  getItem(key: string): string | null {
    if (!canUseStorage()) {
      return null;
    }

    const primary = activeStore();
    return primary.getItem(key) ?? otherStore(primary).getItem(key);
  },

  setItem(key: string, value: string): void {
    if (!canUseStorage()) {
      return;
    }

    const store = activeStore();
    otherStore(store).removeItem(key);
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
