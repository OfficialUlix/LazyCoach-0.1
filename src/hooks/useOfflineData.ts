import { useEffect, useState, useCallback, useRef } from 'react';
import { offlineDataService, SyncableData } from '../services/OfflineDataService';
import { Coach, ChatMessage, Conversation } from '../types';

export interface UseOfflineDataResult {
  isOnline: boolean;
  isSyncing: boolean;
  forceSyncAll: () => Promise<void>;
  searchCoachesOffline: (query: string, specialty?: string, priceRange?: [number, number]) => Promise<Coach[]>;
  getConversationMessages: (conversationId: string) => Promise<ChatMessage[]>;
  storeData: <T>(id: string, type: SyncableData['type'], data: T) => Promise<void>;
  getData: <T>(id: string) => Promise<T | null>;
  queueAction: (action: {
    type: 'create' | 'update' | 'delete';
    entity: 'coach' | 'user' | 'message' | 'conversation' | 'session';
    entityId: string;
    data?: any;
  }) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  networkType: string;
}

export const useOfflineData = (): UseOfflineDataResult => {
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkType, setNetworkType] = useState('unknown');
  const syncListenerRef = useRef<((status: 'started' | 'completed' | 'failed') => void) | null>(null);

  useEffect(() => {
    // Create sync listener
    const syncListener = (status: 'started' | 'completed' | 'failed') => {
      switch (status) {
        case 'started':
          setIsSyncing(true);
          break;
        case 'completed':
        case 'failed':
          setIsSyncing(false);
          break;
      }
    };

    syncListenerRef.current = syncListener;
    offlineDataService.addSyncListener(syncListener);

    // Poll network status
    const networkStatusInterval = setInterval(() => {
      const status = offlineDataService.getNetworkStatus();
      setIsOnline(status.isConnected);
      setNetworkType(status.type);
    }, 1000);

    // Initial network status check
    const initialStatus = offlineDataService.getNetworkStatus();
    setIsOnline(initialStatus.isConnected);
    setNetworkType(initialStatus.type);

    return () => {
      if (syncListenerRef.current) {
        offlineDataService.removeSyncListener(syncListenerRef.current);
      }
      clearInterval(networkStatusInterval);
    };
  }, []);

  const forceSyncAll = useCallback(async () => {
    try {
      await offlineDataService.forceSyncAll();
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  }, []);

  const searchCoachesOffline = useCallback(async (
    query: string,
    specialty?: string,
    priceRange?: [number, number]
  ) => {
    try {
      return await offlineDataService.searchCoachesOffline(query, specialty, priceRange);
    } catch (error) {
      console.error('Failed to search coaches offline:', error);
      return [];
    }
  }, []);

  const getConversationMessages = useCallback(async (conversationId: string) => {
    try {
      return await offlineDataService.getConversationMessages(conversationId);
    } catch (error) {
      console.error('Failed to get conversation messages:', error);
      return [];
    }
  }, []);

  const storeData = useCallback(async <T>(
    id: string,
    type: SyncableData['type'],
    data: T
  ) => {
    try {
      await offlineDataService.storeData(id, type, data);
    } catch (error) {
      console.error('Failed to store data:', error);
      throw error;
    }
  }, []);

  const getData = useCallback(async <T>(id: string): Promise<T | null> => {
    try {
      return await offlineDataService.getData<T>(id);
    } catch (error) {
      console.error('Failed to get data:', error);
      return null;
    }
  }, []);

  const queueAction = useCallback(async (action: {
    type: 'create' | 'update' | 'delete';
    entity: 'coach' | 'user' | 'message' | 'conversation' | 'session';
    entityId: string;
    data?: any;
  }) => {
    try {
      await offlineDataService.queueAction(action);
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }, []);

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineDataService.clearOfflineData();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    networkType,
    forceSyncAll,
    searchCoachesOffline,
    getConversationMessages,
    storeData,
    getData,
    queueAction,
    clearOfflineData,
  };
};