export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  isAvailable(): boolean;
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function canUseStorage(storage: Storage | null): storage is Storage {
  if (!storage) return false;

  try {
    const key = '__fms_storage_probe__';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const safeLocalStorage: SafeStorage = {
  getItem(key) {
    const storage = getLocalStorage();
    if (!storage) return null;

    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    const storage = getLocalStorage();
    if (!storage) return false;

    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key) {
    const storage = getLocalStorage();
    if (!storage) return false;

    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    const storage = getLocalStorage();
    if (!storage) return false;

    try {
      storage.clear();
      return true;
    } catch {
      return false;
    }
  },

  isAvailable() {
    return canUseStorage(getLocalStorage());
  },
};
