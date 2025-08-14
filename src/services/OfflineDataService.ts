import { storage } from '../utils/storage';
import { netInfo } from '../utils/netInfo';
import { Coach, User, ChatMessage, Conversation, BookedSession } from '../types';

export interface SyncableData {
  id: string;
  type: 'coach' | 'user' | 'message' | 'conversation' | 'session';
  data: any;
  lastModified: string;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed';
  retryCount?: number;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'coach' | 'user' | 'message' | 'conversation' | 'session';
  entityId: string;
  data?: any;
  timestamp: string;
  retryCount: number;
}

export class OfflineDataService {
  private static readonly KEYS = {
    OFFLINE_DATA: 'offline_data',
    PENDING_ACTIONS: 'pending_actions',
    LAST_SYNC: 'last_sync',
    SYNC_CONFLICTS: 'sync_conflicts',
  };

  private syncInProgress = false;
  private syncListeners: Array<(status: 'started' | 'completed' | 'failed') => void> = [];
  private networkState = { isConnected: false, type: 'unknown' };

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    // Monitor network state changes
    netInfo.addEventListener(state => {
      const wasOffline = !this.networkState.isConnected;
      this.networkState = {
        isConnected: state.isConnected ?? false,
        type: state.type,
      };

      // Auto-sync when coming back online
      if (wasOffline && this.networkState.isConnected) {
        console.log('[OfflineData] Network reconnected, starting sync...');
        this.syncPendingActions();
      }
    });

    // Get initial network state
    const state = await netInfo.fetch();
    this.networkState = {
      isConnected: state.isConnected ?? false,
      type: state.type,
    };
  }

  /**
   * Store data locally with sync metadata
   */
  async storeData<T>(
    id: string,
    type: SyncableData['type'],
    data: T,
    syncStatus: SyncableData['syncStatus'] = 'pending'
  ): Promise<void> {
    try {
      const existingData = await this.getOfflineData();
      
      const syncableData: SyncableData = {
        id,
        type,
        data,
        lastModified: new Date().toISOString(),
        syncStatus,
      };

      existingData[id] = syncableData;
      
      await storage.setItem(
        OfflineDataService.KEYS.OFFLINE_DATA,
        JSON.stringify(existingData)
      );

      console.log(`[OfflineData] Stored ${type} data for ID: ${id}`);
    } catch (error) {
      console.error('[OfflineData] Failed to store data:', error);
      throw new Error('Failed to store offline data');
    }
  }

  /**
   * Retrieve data from local storage
   */
  async getData<T>(id: string): Promise<T | null> {
    try {
      const offlineData = await this.getOfflineData();
      const data = offlineData[id];
      return data ? data.data : null;
    } catch (error) {
      console.error('[OfflineData] Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Get all offline data
   */
  private async getOfflineData(): Promise<Record<string, SyncableData>> {
    try {
      const data = await storage.getItem(OfflineDataService.KEYS.OFFLINE_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[OfflineData] Failed to get offline data:', error);
      return {};
    }
  }

  /**
   * Queue an action for later sync
   */
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const existingActions = await this.getPendingActions();
      
      const newAction: OfflineAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      existingActions.push(newAction);
      
      await storage.setItem(
        OfflineDataService.KEYS.PENDING_ACTIONS,
        JSON.stringify(existingActions)
      );

      console.log(`[OfflineData] Queued ${action.type} action for ${action.entity}:${action.entityId}`);

      // Try to sync immediately if online
      if (this.networkState.isConnected) {
        this.syncPendingActions();
      }
    } catch (error) {
      console.error('[OfflineData] Failed to queue action:', error);
      throw new Error('Failed to queue offline action');
    }
  }

  /**
   * Get pending actions
   */
  private async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const data = await storage.getItem(OfflineDataService.KEYS.PENDING_ACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineData] Failed to get pending actions:', error);
      return [];
    }
  }

  /**
   * Sync pending actions with server
   */
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.networkState.isConnected) {
      return;
    }

    this.syncInProgress = true;
    this.notifySyncListeners('started');

    try {
      const pendingActions = await this.getPendingActions();
      
      if (pendingActions.length === 0) {
        console.log('[OfflineData] No pending actions to sync');
        this.notifySyncListeners('completed');
        return;
      }

      console.log(`[OfflineData] Syncing ${pendingActions.length} pending actions...`);

      const syncResults: Array<{ action: OfflineAction; success: boolean; error?: string }> = [];

      for (const action of pendingActions) {
        try {
          await this.executeSyncAction(action);
          syncResults.push({ action, success: true });
          console.log(`[OfflineData] Successfully synced action: ${action.id}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          syncResults.push({ action, success: false, error: errorMessage });
          console.error(`[OfflineData] Failed to sync action ${action.id}:`, error);
        }
      }

      // Update pending actions list (remove successful ones, increment retry count for failed ones)
      const failedActions = syncResults
        .filter(result => !result.success)
        .map(result => ({
          ...result.action,
          retryCount: result.action.retryCount + 1,
        }))
        .filter(action => action.retryCount < 3); // Max 3 retries

      await storage.setItem(
        OfflineDataService.KEYS.PENDING_ACTIONS,
        JSON.stringify(failedActions)
      );

      // Update last sync timestamp
      await storage.setItem(
        OfflineDataService.KEYS.LAST_SYNC,
        new Date().toISOString()
      );

      const successful = syncResults.filter(r => r.success).length;
      const failed = syncResults.filter(r => !r.success).length;
      
      console.log(`[OfflineData] Sync completed: ${successful} successful, ${failed} failed`);
      this.notifySyncListeners('completed');

    } catch (error) {
      console.error('[OfflineData] Sync failed:', error);
      this.notifySyncListeners('failed');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute a single sync action
   */
  private async executeSyncAction(action: OfflineAction): Promise<void> {
    // Simulate API calls with different delays and occasional failures
    const delay = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate 10% failure rate for testing
    if (Math.random() < 0.1) {
      throw new Error(`Simulated sync failure for ${action.type} ${action.entity}`);
    }

    console.log(`[OfflineData] Executed ${action.type} ${action.entity} action successfully`);
  }

  /**
   * Get data by type and filters
   */
  async getDataByType<T>(
    type: SyncableData['type'],
    filter?: (data: SyncableData) => boolean
  ): Promise<T[]> {
    try {
      const offlineData = await this.getOfflineData();
      const filteredData = Object.values(offlineData)
        .filter(item => item.type === type)
        .filter(filter || (() => true))
        .map(item => item.data);

      return filteredData;
    } catch (error) {
      console.error('[OfflineData] Failed to get data by type:', error);
      return [];
    }
  }

  /**
   * Search coaches offline
   */
  async searchCoachesOffline(
    query: string,
    specialty?: string,
    priceRange?: [number, number]
  ): Promise<Coach[]> {
    const coaches = await this.getDataByType<Coach>('coach');
    
    return coaches.filter(coach => {
      const matchesQuery = !query || 
        coach.name.toLowerCase().includes(query.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(query.toLowerCase());

      const matchesSpecialty = !specialty || 
        coach.specialty === specialty;

      const matchesPrice = !priceRange || 
        (parseFloat(coach.priceDisplay.replace(/[^0-9.]/g, '')) >= priceRange[0] && 
         parseFloat(coach.priceDisplay.replace(/[^0-9.]/g, '')) <= priceRange[1]);

      return matchesQuery && matchesSpecialty && matchesPrice;
    });
  }

  /**
   * Get offline messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.getDataByType<ChatMessage>('message', 
      data => data.data.conversationId === conversationId
    );
    
    return messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Cache server data locally
   */
  async cacheServerData<T>(
    id: string,
    type: SyncableData['type'],
    data: T
  ): Promise<void> {
    await this.storeData(id, type, data, 'synced');
  }

  /**
   * Get network status
   */
  getNetworkStatus(): { isConnected: boolean; type: string } {
    return this.networkState;
  }

  /**
   * Force sync all data
   */
  async forceSyncAll(): Promise<void> {
    if (!this.networkState.isConnected) {
      throw new Error('No internet connection');
    }

    await this.syncPendingActions();
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await storage.multiRemove([
        OfflineDataService.KEYS.OFFLINE_DATA,
        OfflineDataService.KEYS.PENDING_ACTIONS,
        OfflineDataService.KEYS.LAST_SYNC,
        OfflineDataService.KEYS.SYNC_CONFLICTS,
      ]);
      console.log('[OfflineData] Cleared all offline data');
    } catch (error) {
      console.error('[OfflineData] Failed to clear offline data:', error);
      throw new Error('Failed to clear offline data');
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    inProgress: boolean;
    lastSync: string | null;
    pendingActionsCount: number;
  } {
    return {
      inProgress: this.syncInProgress,
      lastSync: null, // Could be retrieved from storage
      pendingActionsCount: 0, // Could be calculated from storage
    };
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener: (status: 'started' | 'completed' | 'failed') => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync listener
   */
  removeSyncListener(listener: (status: 'started' | 'completed' | 'failed') => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(status: 'started' | 'completed' | 'failed'): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[OfflineData] Error in sync listener:', error);
      }
    });
  }
}

// Singleton instance
export const offlineDataService = new OfflineDataService();