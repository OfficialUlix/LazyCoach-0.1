/**
 * ServiceManager - Central service initialization and health management
 * Ensures all services start up safely and handles initialization failures gracefully
 */

import { analyticsService } from './AnalyticsService';
import { performanceService } from './PerformanceService';
import { realtimeMessagingService } from './RealtimeMessagingService';
import NotificationService from './NotificationService';
import { storage } from '../utils/storage';
import { netInfo } from '../utils/netInfo';

export interface ServiceStatus {
  name: string;
  initialized: boolean;
  error?: string;
  lastHealthCheck?: Date;
}

export interface ServiceInitializer {
  name: string;
  initialize: () => Promise<boolean>;
  isRequired: boolean;
  dependencies?: string[];
}

class ServiceManager {
  private static instance: ServiceManager;
  private serviceStatuses = new Map<string, ServiceStatus>();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Initialize all services in the correct order with error handling
   */
  async initializeServices(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[ServiceManager] Starting service initialization...');
    
    const services: ServiceInitializer[] = [
      {
        name: 'Storage',
        initialize: async () => {
          try {
            await storage.reinitialize();
            return await storage.isAvailable();
          } catch (error) {
            console.error('[ServiceManager] Storage initialization failed:', error);
            return false;
          }
        },
        isRequired: true,
      },
      {
        name: 'NetInfo',
        initialize: async () => {
          try {
            await netInfo.reinitialize();
            return await netInfo.isAvailable();
          } catch (error) {
            console.error('[ServiceManager] NetInfo initialization failed:', error);
            return false;
          }
        },
        isRequired: false,
      },
      {
        name: 'Analytics',
        initialize: async () => {
          try {
            // Analytics service initializes automatically
            const summary = await analyticsService.getAnalyticsSummary();
            return !!summary.sessionId;
          } catch (error) {
            console.error('[ServiceManager] Analytics initialization failed:', error);
            return false;
          }
        },
        isRequired: false,
        dependencies: ['Storage'],
      },
      {
        name: 'Performance',
        initialize: async () => {
          try {
            // Performance service initializes automatically
            const summary = performanceService.getPerformanceSummary();
            return typeof summary.frameCount === 'number';
          } catch (error) {
            console.error('[ServiceManager] Performance initialization failed:', error);
            return false;
          }
        },
        isRequired: false,
        dependencies: ['Analytics'],
      },
      {
        name: 'Notifications',
        initialize: async () => {
          try {
            return await NotificationService.initialize();
          } catch (error) {
            console.error('[ServiceManager] Notifications initialization failed:', error);
            return false;
          }
        },
        isRequired: false,
        dependencies: ['Storage'],
      },
      {
        name: 'RealtimeMessaging',
        initialize: async () => {
          try {
            // Check if realtime messaging is working
            const status = realtimeMessagingService.getConnectionStatus();
            return status === 'connected' || status === 'connecting';
          } catch (error) {
            console.error('[ServiceManager] RealtimeMessaging initialization failed:', error);
            return false;
          }
        },
        isRequired: false,
        dependencies: [],  // Remove dependency on Notifications
      },
    ];

    // Initialize services in dependency order
    for (const service of services) {
      await this.initializeService(service);
    }

    // Start health monitoring
    this.startHealthMonitoring();

    this.isInitialized = true;
    console.log('[ServiceManager] Service initialization completed');
    
    // Log summary
    this.logInitializationSummary();
  }

  private async initializeService(service: ServiceInitializer): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Check dependencies first
      if (service.dependencies) {
        for (const dep of service.dependencies) {
          const depStatus = this.serviceStatuses.get(dep);
          if (!depStatus?.initialized) {
            // If this service is not required, gracefully skip initialization
            if (!service.isRequired) {
              console.warn(`[ServiceManager] ${service.name} skipped: dependency ${dep} not initialized`);
              this.serviceStatuses.set(service.name, {
                name: service.name,
                initialized: false,
                error: `Dependency ${dep} not initialized`,
                lastHealthCheck: new Date(),
              });
              return;
            }
            throw new Error(`Dependency ${dep} not initialized`);
          }
        }
      }

      console.log(`[ServiceManager] Initializing ${service.name}...`);
      const success = await service.initialize();
      const duration = performance.now() - startTime;

      this.serviceStatuses.set(service.name, {
        name: service.name,
        initialized: success,
        error: success ? undefined : 'Initialization failed',
        lastHealthCheck: new Date(),
      });

      if (success) {
        console.log(`[ServiceManager] ${service.name} initialized successfully (${duration.toFixed(0)}ms)`);
      } else {
        const message = `${service.name} failed to initialize`;
        console.warn(`[ServiceManager] ${message}`);
        
        if (service.isRequired) {
          throw new Error(message);
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = (error as Error).message || 'Unknown error';
      
      this.serviceStatuses.set(service.name, {
        name: service.name,
        initialized: false,
        error: errorMessage,
        lastHealthCheck: new Date(),
      });

      console.error(`[ServiceManager] ${service.name} initialization failed (${duration.toFixed(0)}ms):`, errorMessage);
      
      if (service.isRequired) {
        throw error;
      }
    }
  }

  /**
   * Start periodic health monitoring of services
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('[ServiceManager] Health check failed:', error);
      });
    }, 300000); // Every 5 minutes

    console.log('[ServiceManager] Health monitoring started');
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check storage
      const storageAvailable = await storage.isAvailable();
      const storageStatus = this.serviceStatuses.get('Storage');
      if (storageStatus) {
        storageStatus.initialized = storageAvailable;
        storageStatus.lastHealthCheck = new Date();
        if (!storageAvailable) {
          storageStatus.error = 'Storage not available';
        }
      }

      // Check network
      const netInfoState = await netInfo.fetch();
      const netInfoStatus = this.serviceStatuses.get('NetInfo');
      if (netInfoStatus) {
        netInfoStatus.initialized = !!netInfoState;
        netInfoStatus.lastHealthCheck = new Date();
      }

      // Check realtime messaging
      const messagingStatus = this.serviceStatuses.get('RealtimeMessaging');
      if (messagingStatus) {
        const connectionStatus = realtimeMessagingService.getConnectionStatus();
        messagingStatus.initialized = connectionStatus === 'connected';
        messagingStatus.lastHealthCheck = new Date();
      }

    } catch (error) {
      console.error('[ServiceManager] Health check error:', error);
    }
  }

  private logInitializationSummary(): void {
    const statuses = Array.from(this.serviceStatuses.values());
    const initialized = statuses.filter(s => s.initialized).length;
    const total = statuses.length;
    const failed = statuses.filter(s => !s.initialized);

    console.log(`[ServiceManager] Initialization Summary: ${initialized}/${total} services initialized`);
    
    if (failed.length > 0) {
      console.warn('[ServiceManager] Failed services:', failed.map(s => `${s.name}: ${s.error}`));
    }
  }

  /**
   * Get status of all services
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get status of a specific service
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * Check if all required services are running
   */
  areRequiredServicesHealthy(): boolean {
    const storageStatus = this.serviceStatuses.get('Storage');
    return storageStatus?.initialized === true;
  }

  /**
   * Get initialization summary for debugging
   */
  getInitializationSummary(): {
    isInitialized: boolean;
    totalServices: number;
    initializedServices: number;
    failedServices: string[];
  } {
    const statuses = Array.from(this.serviceStatuses.values());
    const failed = statuses.filter(s => !s.initialized).map(s => s.name);

    return {
      isInitialized: this.isInitialized,
      totalServices: statuses.length,
      initializedServices: statuses.filter(s => s.initialized).length,
      failedServices: failed,
    };
  }

  /**
   * Force re-initialization of all services (useful for recovery)
   */
  async reinitializeServices(): Promise<void> {
    console.log('[ServiceManager] Forcing service re-initialization...');
    this.isInitialized = false;
    this.initializationPromise = null;
    this.serviceStatuses.clear();
    
    await this.initializeServices();
  }
}

// Singleton instance
export const serviceManager = ServiceManager.getInstance();