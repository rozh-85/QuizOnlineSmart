import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryStorage = new Map<string, string>();

const getWebStorage = (): WebStorage | null => {
  if (Platform.OS !== 'web') {
    return null;
  }

  const maybeGlobal = globalThis as typeof globalThis & {
    localStorage?: WebStorage;
  };

  return maybeGlobal.localStorage ?? null;
};

const canUseSecureStore = () =>
  Platform.OS !== 'web' &&
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function' &&
  typeof SecureStore.deleteItemAsync === 'function';

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    const webStorage = getWebStorage();
    if (webStorage) {
      return webStorage.getItem(key);
    }

    if (canUseSecureStore()) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return memoryStorage.get(key) ?? null;
      }
    }

    return memoryStorage.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(key, value);
      return;
    }

    if (canUseSecureStore()) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        memoryStorage.set(key, value);
        return;
      }
    }

    memoryStorage.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(key);
      return;
    }

    if (canUseSecureStore()) {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch {
        memoryStorage.delete(key);
        return;
      }
    }

    memoryStorage.delete(key);
  },
};
