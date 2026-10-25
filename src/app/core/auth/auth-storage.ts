const PERSIST_KEY = 'dm-auth-persist';

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined';
}

/** 未勾選記住我時，工作階段只留在這個分頁。 */
function activeStore(): Storage {
  if (localStorage.getItem(PERSIST_KEY) === '1') {
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
