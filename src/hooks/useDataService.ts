import { useState, useEffect, useCallback } from 'react';
import DataService, { DataServiceOptions } from '../services/DataService';
import { Coach, BookedSession, Conversation, ChatMessage } from '../types';

interface UseDataServiceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isCached: boolean;
}

export function useCoaches(options: DataServiceOptions = {}): UseDataServiceResult<Coach[]> {
  const [data, setData] = useState<Coach[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const coaches = await DataService.getCoaches({ 
        ...options, 
        forceRefresh 
      });
      const loadTime = Date.now() - startTime;
      
      // If load time is very fast, it's likely from cache
      setIsCached(loadTime < 100);
      setData(coaches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coaches');
    } finally {
      setLoading(false);
    }
  }, [options]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, isCached };
}

export function useCoach(id: string, options: DataServiceOptions = {}): UseDataServiceResult<Coach> {
  const [data, setData] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const coach = await DataService.getCoach(id, { 
        ...options, 
        forceRefresh 
      });
      const loadTime = Date.now() - startTime;
      
      setIsCached(loadTime < 100);
      setData(coach);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coach');
    } finally {
      setLoading(false);
    }
  }, [id, options]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, isCached };
}

export function useSessions(userId: string, options: DataServiceOptions = {}): UseDataServiceResult<BookedSession[]> {
  const [data, setData] = useState<BookedSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const sessions = await DataService.getSessions(userId, { 
        ...options, 
        forceRefresh 
      });
      const loadTime = Date.now() - startTime;
      
      setIsCached(loadTime < 100);
      setData(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, isCached };
}

export function useConversations(userId: string, options: DataServiceOptions = {}): UseDataServiceResult<Conversation[]> {
  const [data, setData] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const conversations = await DataService.getConversations(userId, { 
        ...options, 
        forceRefresh 
      });
      const loadTime = Date.now() - startTime;
      
      setIsCached(loadTime < 100);
      setData(conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, isCached };
}

export function useMessages(conversationId: string, options: DataServiceOptions = {}): UseDataServiceResult<ChatMessage[]> {
  const [data, setData] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const messages = await DataService.getMessages(conversationId, { 
        ...options, 
        forceRefresh 
      });
      const loadTime = Date.now() - startTime;
      
      setIsCached(loadTime < 100);
      setData(messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, options]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, isCached };
}

export function useSearchCoaches(
  query: string,
  specialty?: string,
  priceRange?: [number, number],
  minRating?: number,
  options: DataServiceOptions = {}
): UseDataServiceResult<Coach[]> {
  const [data, setData] = useState<Coach[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      const coaches = await DataService.searchCoaches(
        query,
        specialty,
        priceRange,
        minRating,
        options
      );
      const loadTime = Date.now() - startTime;
      
      setIsCached(loadTime < 100);
      setData(coaches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search coaches');
    } finally {
      setLoading(false);
    }
  }, [query, specialty, priceRange, minRating, options]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  useEffect(() => {
    // Only search if there's a query
    if (query.trim()) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
      setError(null);
    }
  }, [query, specialty, priceRange, minRating, fetchData]);

  return { data, loading, error, refresh, isCached };
}