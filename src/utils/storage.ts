import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleStorage {
  private memoryStorage = new Map<string, string>();
  private isAsyncStorageAvailable = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.checkAsyncStorage();
  }

  private async checkAsyncStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('test', 'test');
      await AsyncStorage.removeItem('test');
      this.isAsyncStorageAvailable = true;
      console.log('[Storage] AsyncStorage available');
    } catch (error) {
      this.isAsyncStorageAvailable = false;
      console.warn('[Storage] AsyncStorage not available, using memory storage');
    }
  }

  async reinitialize(): Promise<void> {
    this.initializationPromise = this.checkAsyncStorage();
    return this.initializationPromise;
  }

  async isAvailable(): Promise<boolean> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.isAsyncStorageAvailable;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isAsyncStorageAvailable) {
        return await AsyncStorage.getItem(key);
      }
      return this.memoryStorage.get(key) || null;
    } catch (error) {
      return this.memoryStorage.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isAsyncStorageAvailable) {
        await AsyncStorage.setItem(key, value);
      }
      this.memoryStorage.set(key, value);
    } catch (error) {
      this.memoryStorage.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isAsyncStorageAvailable) {
        await AsyncStorage.removeItem(key);
      }
      this.memoryStorage.delete(key);
    } catch (error) {
      this.memoryStorage.delete(key);
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const results: Array<[string, string | null]> = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    return results;
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isAsyncStorageAvailable) {
        await AsyncStorage.clear();
      }
      this.memoryStorage.clear();
    } catch (error) {
      this.memoryStorage.clear();
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (this.isAsyncStorageAvailable) {
        const keys = await AsyncStorage.getAllKeys();
        return [...keys];
      }
      return Array.from(this.memoryStorage.keys());
    } catch (error) {
      return Array.from(this.memoryStorage.keys());
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (this.isAsyncStorageAvailable) {
        await AsyncStorage.multiRemove(keys);
      }
      keys.forEach(key => this.memoryStorage.delete(key));
    } catch (error) {
      keys.forEach(key => this.memoryStorage.delete(key));
    }
  }
}

export const storage = new SimpleStorage();
export default storage;