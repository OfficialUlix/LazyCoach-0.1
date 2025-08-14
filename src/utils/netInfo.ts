import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  type: string;
}

class SimpleNetInfo {
  private currentState: NetworkState = { isConnected: true, type: 'unknown' };
  private available = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      this.available = true;
      this.currentState = {
        isConnected: state.isConnected ?? true,
        type: state.type || 'unknown'
      };
      console.log('[NetInfo] Initialized successfully');
    } catch (error) {
      this.available = false;
      console.warn('[NetInfo] Not available, using defaults');
    }
  }

  async reinitialize(): Promise<void> {
    this.initializationPromise = this.initialize();
    return this.initializationPromise;
  }

  async isAvailable(): Promise<boolean> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.available;
  }

  async fetch(): Promise<NetworkState> {
    return this.getNetworkState();
  }

  async getNetworkState(): Promise<NetworkState> {
    if (!this.available) {
      return this.currentState;
    }

    try {
      const state = await NetInfo.fetch();
      this.currentState = {
        isConnected: state.isConnected ?? true,
        type: state.type || 'unknown'
      };
      return this.currentState;
    } catch (error) {
      return this.currentState;
    }
  }

  isConnected(): boolean {
    return this.currentState.isConnected;
  }

  addEventListener(listener: (state: NetworkState) => void): () => void {
    try {
      const unsubscribe = NetInfo.addEventListener((state) => {
        const networkState = {
          isConnected: state.isConnected ?? true,
          type: state.type || 'unknown'
        };
        this.currentState = networkState;
        listener(networkState);
      });
      return unsubscribe;
    } catch (error) {
      console.warn('[NetInfo] addEventListener failed, using no-op');
      return () => {};
    }
  }
}

export const netInfo = new SimpleNetInfo();
export default netInfo;