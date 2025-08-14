import CacheService from './CacheService';
import { offlineDataService } from './OfflineDataService';
import { Coach, BookedSession, Conversation, ChatMessage } from '../types';
import { mockCoaches } from '../utils/mockData';
import { handleApiError } from '../utils/errorHandling';

export interface DataServiceOptions {
  useCache?: boolean;
  forceRefresh?: boolean;
  cacheTTL?: number;
  offlineFirst?: boolean;
}

class DataService {
  private static instance: DataService;
  private cache = CacheService;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Coach-related methods
  async getCoaches(options: DataServiceOptions = {}): Promise<Coach[]> {
    const { 
      useCache = true, 
      forceRefresh = false, 
      cacheTTL = 10 * 60 * 1000,
      offlineFirst = false 
    } = options;
    const cacheKey = 'coaches_list';

    try {
      const networkStatus = offlineDataService.getNetworkStatus();
      
      // If offline or offline-first, try to get data from offline storage
      if (!networkStatus.isConnected || offlineFirst) {
        console.log('DataService: Getting coaches from offline storage');
        const offlineCoaches = await offlineDataService.getDataByType<Coach>('coach');
        
        if (offlineCoaches.length > 0) {
          console.log(`DataService: Returning ${offlineCoaches.length} offline coaches`);
          return offlineCoaches;
        }
        
        // If offline and no cached data, return empty array or fallback data
        if (!networkStatus.isConnected) {
          console.log('DataService: No offline data available, returning empty array');
          return [];
        }
      }

      // Check cache first if enabled and not forcing refresh
      if (useCache && !forceRefresh && networkStatus.isConnected) {
        const cachedCoaches = await this.cache.get<Coach[]>(cacheKey);
        if (cachedCoaches) {
          console.log('DataService: Returning cached coaches');
          // Also store in offline storage for future offline access
          cachedCoaches.forEach(async (coach, index) => {
            await offlineDataService.cacheServerData(coach.id, 'coach', coach);
          });
          return cachedCoaches;
        }
      }

      // Only fetch from API if online
      if (networkStatus.isConnected) {
        // Simulate API call
        console.log('DataService: Fetching coaches from API');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate occasional network error
        if (Math.random() < 0.05) {
          throw new Error('Network request failed');
        }

        const coaches = [...mockCoaches];

        // Cache the result if caching is enabled
        if (useCache) {
          await this.cache.set(cacheKey, coaches, { ttl: cacheTTL });
        }

        // Store in offline storage for future offline access
        coaches.forEach(async (coach) => {
          await offlineDataService.cacheServerData(coach.id, 'coach', coach);
        });

        return coaches;
      } else {
        // Not connected, try to get offline data
        const offlineCoaches = await offlineDataService.getDataByType<Coach>('coach');
        return offlineCoaches;
      }
    } catch (error) {
      // Try to return offline/cached data if API fails
      const offlineCoaches = await offlineDataService.getDataByType<Coach>('coach');
      if (offlineCoaches.length > 0) {
        console.log('DataService: API failed, returning offline coaches');
        return offlineCoaches;
      }

      if (useCache) {
        const cachedCoaches = await this.cache.get<Coach[]>(cacheKey);
        if (cachedCoaches) {
          console.log('DataService: API failed, returning cached coaches');
          return cachedCoaches;
        }
      }
      
      throw handleApiError(error);
    }
  }

  async getCoach(id: string, options: DataServiceOptions = {}): Promise<Coach | null> {
    const { useCache = true, forceRefresh = false, cacheTTL = 15 * 60 * 1000 } = options;
    const cacheKey = `coach_${id}`;

    try {
      // Check cache first
      if (useCache && !forceRefresh) {
        const cachedCoach = await this.cache.get<Coach>(cacheKey);
        if (cachedCoach) {
          return cachedCoach;
        }
      }

      // Get from coaches list (simulate API call)
      const coaches = await this.getCoaches({ useCache: false });
      const coach = coaches.find(c => c.id === id) || null;

      // Cache individual coach
      if (coach && useCache) {
        await this.cache.set(cacheKey, coach, { ttl: cacheTTL });
      }

      return coach;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async searchCoaches(
    query: string,
    specialty?: string,
    priceRange?: [number, number],
    minRating?: number,
    options: DataServiceOptions = {}
  ): Promise<Coach[]> {
    const searchKey = `search_${query}_${specialty}_${priceRange?.join('-')}_${minRating}`;
    const { useCache = true, cacheTTL = 5 * 60 * 1000 } = options;

    try {
      // Check cache for search results
      if (useCache) {
        const cachedResults = await this.cache.get<Coach[]>(searchKey);
        if (cachedResults) {
          return cachedResults;
        }
      }

      // Get all coaches and filter
      const allCoaches = await this.getCoaches(options);
      const filteredCoaches = allCoaches.filter(coach => {
        const matchesQuery = !query || 
          coach.name.toLowerCase().includes(query.toLowerCase()) ||
          coach.specialty.toLowerCase().includes(query.toLowerCase()) ||
          coach.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

        const matchesSpecialty = !specialty || coach.specialty === specialty;
        const matchesPrice = !priceRange || 
          (coach.price >= priceRange[0] && coach.price <= priceRange[1]);
        const matchesRating = !minRating || coach.rating >= minRating;

        return matchesQuery && matchesSpecialty && matchesPrice && matchesRating;
      });

      // Cache search results
      if (useCache) {
        await this.cache.set(searchKey, filteredCoaches, { ttl: cacheTTL });
      }

      return filteredCoaches;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Session-related methods
  async getSessions(userId: string, options: DataServiceOptions = {}): Promise<BookedSession[]> {
    const { useCache = true, forceRefresh = false, cacheTTL = 2 * 60 * 1000 } = options;
    const cacheKey = `sessions_${userId}`;

    try {
      if (useCache && !forceRefresh) {
        const cachedSessions = await this.cache.get<BookedSession[]>(cacheKey);
        if (cachedSessions) {
          return cachedSessions;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock sessions data
      const sessions: BookedSession[] = [
        {
          id: '1',
          coachId: '1',
          coachName: 'Sarah Johnson',
          timeSlot: {
            id: '1-1',
            start: '09:00',
            end: '10:00',
            available: false,
            date: '2025-01-20',
          },
          status: 'upcoming',
          price: 80,
          notes: 'Focus on career transition planning',
        },
        {
          id: '2',
          coachId: '2',
          coachName: 'Michael Chen',
          timeSlot: {
            id: '2-1',
            start: '16:00',
            end: '17:00',
            available: false,
            date: '2025-01-18',
          },
          status: 'upcoming',
          price: 120,
          notes: 'Business strategy session',
        },
      ];

      if (useCache) {
        await this.cache.set(cacheKey, sessions, { ttl: cacheTTL });
      }

      return sessions;
    } catch (error) {
      if (useCache) {
        const cachedSessions = await this.cache.get<BookedSession[]>(cacheKey);
        if (cachedSessions) {
          return cachedSessions;
        }
      }
      
      throw handleApiError(error);
    }
  }

  // Conversation-related methods
  async getConversations(userId: string, options: DataServiceOptions = {}): Promise<Conversation[]> {
    const { useCache = true, forceRefresh = false, cacheTTL = 1 * 60 * 1000 } = options;
    const cacheKey = `conversations_${userId}`;

    try {
      if (useCache && !forceRefresh) {
        const cached = await this.cache.get<Conversation[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      const conversations: Conversation[] = [
        {
          id: '1',
          coachId: '1',
          coachName: 'Sarah Johnson',
          lastMessage: 'Looking forward to our session tomorrow!',
          lastMessageTime: '2025-01-11T14:30:00Z',
          unreadCount: 2,
          messages: [],
        },
        {
          id: '2',
          coachId: '2',
          coachName: 'Michael Chen',
          lastMessage: 'Here are the resources I mentioned...',
          lastMessageTime: '2025-01-10T16:45:00Z',
          unreadCount: 0,
          messages: [],
        },
      ];

      if (useCache) {
        await this.cache.set(cacheKey, conversations, { ttl: cacheTTL });
      }

      return conversations;
    } catch (error) {
      if (useCache) {
        const cached = await this.cache.get<Conversation[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      throw handleApiError(error);
    }
  }

  async getMessages(conversationId: string, options: DataServiceOptions = {}): Promise<ChatMessage[]> {
    const { useCache = true, forceRefresh = false, cacheTTL = 30 * 1000 } = options;
    const cacheKey = `messages_${conversationId}`;

    try {
      if (useCache && !forceRefresh) {
        const cached = await this.cache.get<ChatMessage[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));

      const messages: ChatMessage[] = [
        {
          id: '1',
          senderId: '1',
          senderName: 'Sarah Johnson',
          message: 'Hi! Thanks for booking a session with me. Looking forward to working together!',
          timestamp: '2025-01-10T10:00:00Z',
          type: 'text',
        },
        {
          id: '2',
          senderId: 'user-1',
          senderName: 'You',
          message: 'Thanks Sarah! I\'m excited to get started on my career goals.',
          timestamp: '2025-01-10T10:05:00Z',
          type: 'text',
        },
      ];

      if (useCache) {
        await this.cache.set(cacheKey, messages, { ttl: cacheTTL });
      }

      return messages;
    } catch (error) {
      if (useCache) {
        const cached = await this.cache.get<ChatMessage[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      throw handleApiError(error);
    }
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  async clearCoachCache(): Promise<void> {
    await this.cache.clear('lazycoach_cache_coach');
    await this.cache.remove('coaches_list');
  }

  async clearUserCache(userId: string): Promise<void> {
    await this.cache.remove(`sessions_${userId}`);
    await this.cache.remove(`conversations_${userId}`);
  }

  async getCacheStats() {
    return await this.cache.getStats();
  }

  async cleanupExpiredCache(): Promise<number> {
    return await this.cache.cleanup();
  }

  // Prefetch data for better performance
  async prefetchUserData(userId: string): Promise<void> {
    try {
      // Prefetch common user data in parallel
      await Promise.all([
        this.getCoaches({ useCache: true }),
        this.getSessions(userId, { useCache: true }),
        this.getConversations(userId, { useCache: true }),
      ]);
      
      console.log('DataService: User data prefetched successfully');
    } catch (error) {
      console.error('DataService: Failed to prefetch user data', error);
    }
  }
}

export default DataService.getInstance();