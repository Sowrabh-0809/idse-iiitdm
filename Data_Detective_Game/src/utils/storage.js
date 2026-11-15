/**
 * LocalStorage wrapper with error handling and in-memory fallback.
 * Safe for both browser runtime and Node / Vitest testing environments.
 */
const STORAGE_PREFIX = 'IIITDM_DATA_DETECTIVE_';

let inMemoryStore = {};

function isLocalStorageAvailable() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}

export const storage = {
  get(key, defaultValue = null) {
    if (!isLocalStorageAvailable()) {
      return inMemoryStore[key] !== undefined ? inMemoryStore[key] : defaultValue;
    }
    try {
      const fullKey = STORAGE_PREFIX + key;
      const raw = window.localStorage.getItem(fullKey);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return inMemoryStore[key] !== undefined ? inMemoryStore[key] : defaultValue;
    }
  },

  set(key, value) {
    inMemoryStore[key] = value;
    if (!isLocalStorageAvailable()) return;
    try {
      const fullKey = STORAGE_PREFIX + key;
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      // Memory store already holds the state
    }
  },

  remove(key) {
    delete inMemoryStore[key];
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      // ignore
    }
  },

  clearAll() {
    inMemoryStore = {};
    if (!isLocalStorageAvailable()) return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }
};
