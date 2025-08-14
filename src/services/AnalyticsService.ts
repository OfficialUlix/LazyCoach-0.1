import storage from '../utils/storage';
import { User } from '../types';

export interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: string;
  sessionId: string;
}

export interface ScreenViewEvent {
  screenName: string;
  previousScreen?: string;
  duration?: number;
}

export interface UserActionEvent {
  action: string;
  target: string;
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | '%';
  timestamp: string;
  context?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string = '';
  private userId?: string;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private currentScreen?: string;
  private screenStartTime?: number;
  private batchTimer?: NodeJS.Timeout;
  private readonly MAX_QUEUE_SIZE = 50; // Reduced queue size to prevent memory issues
  private readonly BATCH_SIZE = 10; // Smaller batches for better memory management

  private readonly STORAGE_KEYS = {
    EVENTS: 'analytics_events',
    METRICS: 'performance_metrics',
    SESSION_ID: 'session_id',
    USER_PROPERTIES: 'user_properties',
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  private async initialize(): Promise<void> {
    try {
      // Generate or retrieve session ID
      this.sessionId = await this.getOrCreateSessionId();
      
      // Load queued events from storage
      await this.loadQueuedEvents();
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Set up performance service callback to avoid circular imports
      this.setupPerformanceServiceCallback();
      
      this.isInitialized = true;
      console.log('[Analytics] Service initialized with session:', this.sessionId);
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
    }
  }

  /**
   * Set up performance service callback to receive metrics without circular imports
   */
  private setupPerformanceServiceCallback(): void {
    try {
      // Use setTimeout to break circular dependency at runtime
      setTimeout(() => {
        try {
          const { performanceService } = require('./PerformanceService');
          performanceService.setMetricsCallback((metric: string, value: number, unit: 'ms' | 'bytes' | 'count' | '%', context?: Record<string, any>) => {
            this.trackPerformance(metric, value, unit, context);
          });
        } catch (requireError) {
          console.warn('[Analytics] Failed to require performance service:', requireError);
        }
      }, 100);
    } catch (error) {
      console.warn('[Analytics] Failed to setup performance callback:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserId(userId: string, properties?: Record<string, any>): Promise<void> {
    this.userId = userId;
    
    if (properties) {
      await this.setUserProperties(properties);
    }

    // Track user identification
    this.track('user_identified', {
      userId,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      const existingProperties = await this.getUserProperties();
      const updatedProperties = { ...existingProperties, ...properties };
      
      await storage.setItem(
        this.STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(updatedProperties)
      );
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) {
      console.warn('[Analytics] Service not initialized, queueing event');
    }

    // Prevent queue from growing too large
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('[Analytics] Event queue full, processing batch immediately');
      this.processBatch().catch(error => {
        console.error('[Analytics] Failed to process batch on queue overflow:', error);
      });
    }

    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      properties: this.sanitizeProperties(properties),
      userId: this.userId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    this.eventQueue.push(event);
    console.log(`[Analytics] Tracked event: ${eventName}`);
  }

  /**
   * Sanitize properties to prevent memory leaks from large objects
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else if (typeof value === 'object' && value !== null) {
        // Prevent deep nested objects
        sanitized[key] = JSON.stringify(value).substring(0, 500);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string): void {
    // Track duration of previous screen
    if (this.currentScreen && this.screenStartTime) {
      const duration = Date.now() - this.screenStartTime;
      this.track('screen_view', {
        screenName: this.currentScreen,
        duration,
        unit: 'ms',
      });
    }

    // Set up new screen tracking
    this.currentScreen = screenName;
    this.screenStartTime = Date.now();

    // Track screen entry
    this.track('screen_enter', { screenName });
  }

  /**
   * Track user action
   */
  trackAction(action: UserActionEvent): void {
    this.track('user_action', {
      action: action.action,
      target: action.target,
      ...action.context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: PerformanceMetric['unit'], context?: Record<string, any>): void {
    // Prevent metrics queue from growing too large
    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('[Analytics] Metrics queue full, processing batch immediately');
      this.processBatch().catch(error => {
        console.error('[Analytics] Failed to process metrics batch on overflow:', error);
      });
    }

    const performanceMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeProperties(context) : undefined,
    };

    this.metricsQueue.push(performanceMetric);
    // Minimal logging to prevent console spam and reduce memory usage
    if (Math.random() < 0.05) { // Only log 5% of performance metrics
      console.log(`[Analytics] Performance metric: ${metric} = ${value}${unit}`);
    }
  }

  /**
   * Track app startup time
   */
  trackAppStartup(startTime: number): void {
    const startupTime = Date.now() - startTime;
    this.trackPerformance('app_startup', startupTime, 'ms', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track API response time
   */
  trackApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.track('api_call', {
      endpoint,
      method,
      duration,
      status,
      success: status >= 200 && status < 300,
    });

    this.trackPerformance('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status,
    });
  }

  /**
   * Track search query
   */
  trackSearch(query: string, results: number, filters?: Record<string, any>): void {
    this.track('search_performed', {
      query,
      results,
      queryLength: query.length,
      hasFilters: filters ? Object.keys(filters).length > 0 : false,
      ...filters,
    });
  }

  /**
   * Track booking event
   */
  trackBooking(coachId: string, sessionType: string, price: number): void {
    this.track('booking_created', {
      coachId,
      sessionType,
      price,
      currency: 'USD',
    });
  }

  /**
   * Track message sent
   */
  trackMessage(conversationId: string, messageLength: number, isFirstMessage: boolean): void {
    this.track('message_sent', {
      conversationId,
      messageLength,
      isFirstMessage,
    });
  }

  /**
   * Track error event
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error_occurred', {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Get user properties
   */
  private async getUserProperties(): Promise<Record<string, any>> {
    try {
      const properties = await storage.getItem(this.STORAGE_KEYS.USER_PROPERTIES);
      return properties ? JSON.parse(properties) : {};
    } catch (error) {
      console.error('[Analytics] Failed to get user properties:', error);
      return {};
    }
  }

  /**
   * Get or create session ID
   */
  private async getOrCreateSessionId(): Promise<string> {
    try {
      const existingSessionId = await storage.getItem(this.STORAGE_KEYS.SESSION_ID);
      
      if (existingSessionId) {
        return existingSessionId;
      }

      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await storage.setItem(this.STORAGE_KEYS.SESSION_ID, newSessionId);
      
      return newSessionId;
    } catch (error) {
      console.error('[Analytics] Failed to get/create session ID:', error);
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Load queued events from storage
   */
  private async loadQueuedEvents(): Promise<void> {
    try {
      const [eventsData, metricsData] = await Promise.all([
        storage.getItem(this.STORAGE_KEYS.EVENTS),
        storage.getItem(this.STORAGE_KEYS.METRICS),
      ]);

      if (eventsData) {
        const events = JSON.parse(eventsData) as AnalyticsEvent[];
        this.eventQueue.push(...events);
      }

      if (metricsData) {
        const metrics = JSON.parse(metricsData) as PerformanceMetric[];
        this.metricsQueue.push(...metrics);
      }
    } catch (error) {
      console.error('[Analytics] Failed to load queued events:', error);
    }
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(async () => {
      await this.processBatch();
    }, 60000); // Process every 60 seconds (reduced frequency)
  }

  /**
   * Process queued events and metrics in smaller batches
   */
  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0 && this.metricsQueue.length === 0) {
      return;
    }

    try {
      // Process in smaller batches to prevent memory spikes
      const eventsToProcess = this.eventQueue.splice(0, this.BATCH_SIZE);
      const metricsToProcess = this.metricsQueue.splice(0, this.BATCH_SIZE);

      if (eventsToProcess.length > 0 || metricsToProcess.length > 0) {
        console.log(`[Analytics] Processing batch: ${eventsToProcess.length} events, ${metricsToProcess.length} metrics`);

        // Store locally for now (in real app, send to server)
        await this.storeEventsLocally(eventsToProcess, metricsToProcess);
      }

      // If there are more items to process, schedule another batch
      if (this.eventQueue.length > 0 || this.metricsQueue.length > 0) {
        setTimeout(() => {
          this.processBatch().catch(error => {
            console.error('[Analytics] Failed to process additional batch:', error);
          });
        }, 2000); // Longer delay between batches to reduce CPU usage
      }

    } catch (error) {
      console.error('[Analytics] Failed to process batch:', error);
      // On error, put items back in queue (but limit to prevent infinite growth)
      // this.eventQueue.unshift(...eventsToProcess.slice(0, this.MAX_QUEUE_SIZE - this.eventQueue.length));
      // this.metricsQueue.unshift(...metricsToProcess.slice(0, this.MAX_QUEUE_SIZE - this.metricsQueue.length));
    }
  }

  /**
   * Store events locally (updated to handle batches)
   */
  private async storeEventsLocally(events: AnalyticsEvent[] = [], metrics: PerformanceMetric[] = []): Promise<void> {
    try {
      // In a real implementation, these would be sent to a server
      // For now, we'll just clear them to prevent memory accumulation
      console.log(`[Analytics] Processed ${events.length} events and ${metrics.length} metrics`);
      
      // Could store a summary or sample for debugging purposes
      if (events.length > 0 || metrics.length > 0) {
        const summary = {
          processedAt: new Date().toISOString(),
          eventCount: events.length,
          metricCount: metrics.length,
          sample: {
            events: events.slice(0, 3), // Keep only first 3 for debugging
            metrics: metrics.slice(0, 3),
          }
        };
        
        await storage.setItem('analytics_last_processed', JSON.stringify(summary));
      }
    } catch (error) {
      console.error('[Analytics] Failed to store events locally:', error);
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<{
    eventsCount: number;
    metricsCount: number;
    sessionId: string;
    userId?: string;
  }> {
    return {
      eventsCount: this.eventQueue.length,
      metricsCount: this.metricsQueue.length,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  /**
   * Clear all analytics data
   */
  async clearAnalyticsData(): Promise<void> {
    try {
      await storage.removeItem(this.STORAGE_KEYS.EVENTS);
      await storage.removeItem(this.STORAGE_KEYS.METRICS);
      await storage.removeItem(this.STORAGE_KEYS.USER_PROPERTIES);
      
      this.eventQueue = [];
      this.metricsQueue = [];
      
      console.log('[Analytics] Cleared all analytics data');
    } catch (error) {
      console.error('[Analytics] Failed to clear analytics data:', error);
    }
  }

  /**
   * Stop analytics service
   */
  stop(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Process any remaining events before stopping
    this.processBatch();
    
    console.log('[Analytics] Service stopped');
  }
}

// Singleton instance
export const analyticsService = AnalyticsService.getInstance();