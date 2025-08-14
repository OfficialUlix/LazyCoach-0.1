// Removed direct dependency on AnalyticsService to prevent circular imports
// Performance metrics will be sent via callback pattern instead

export interface PerformanceTimer {
  id: string;
  name: string;
  startTime: number;
  context?: Record<string, any>;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface MetricsCallback {
  (metric: string, value: number, unit: 'ms' | 'bytes' | 'count' | '%', context?: Record<string, any>): void;
}

class PerformanceService {
  private static instance: PerformanceService;
  private timers = new Map<string, PerformanceTimer>();
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsReadings: number[] = [];
  private readonly MAX_FPS_READINGS = 60; // Limit FPS readings to prevent memory growth
  private readonly MAX_TIMERS = 50; // Limit concurrent timers
  private metricsCallback: MetricsCallback | null = null;

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Set callback for metrics reporting to avoid circular imports
   */
  setMetricsCallback(callback: MetricsCallback): void {
    this.metricsCallback = callback;
  }

  /**
   * Send metric to callback or log it
   */
  private sendMetric(metric: string, value: number, unit: 'ms' | 'bytes' | 'count' | '%', context?: Record<string, any>): void {
    if (this.metricsCallback) {
      this.metricsCallback(metric, value, unit, context);
    } else {
      // Fallback to console logging if no callback set
      console.log(`[Performance] ${metric}: ${value}${unit}`, context);
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    try {
      // Monitor FPS
      this.startFpsMonitoring();
      
      // Monitor memory usage periodically (less frequent to reduce overhead)
      setInterval(() => {
        this.checkMemoryUsage().catch(error => {
          console.error('[Performance] Memory check failed:', error);
        });
      }, 120000); // Every 2 minutes instead of 1

      console.log('[Performance] Monitoring initialized');
    } catch (error) {
      console.error('[Performance] Failed to initialize monitoring:', error);
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string, context?: Record<string, any>): string {
    // Prevent too many concurrent timers
    if (this.timers.size >= this.MAX_TIMERS) {
      console.warn('[Performance] Too many concurrent timers, cleaning up old ones');
      this.cleanupOldTimers();
    }

    const id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const timer: PerformanceTimer = {
      id,
      name,
      startTime: performance.now(),
      context,
    };

    this.timers.set(id, timer);
    
    // Reduced logging frequency
    if (Math.random() < 0.2) { // Only log 20% of timer starts
      console.log(`[Performance] Started timer: ${name}`);
    }
    
    return id;
  }

  /**
   * Clean up old timers to prevent memory leaks
   */
  private cleanupOldTimers(): void {
    const now = performance.now();
    const maxAge = 30000; // 30 seconds max timer age
    
    for (const [id, timer] of this.timers.entries()) {
      if (now - timer.startTime > maxAge) {
        this.timers.delete(id);
        console.warn(`[Performance] Cleaned up old timer: ${timer.name} (${id})`);
      }
    }
  }

  /**
   * End a performance timer and track the result
   */
  endTimer(id: string): number | null {
    const timer = this.timers.get(id);
    
    if (!timer) {
      console.warn(`[Performance] Timer not found: ${id}`);
      return null;
    }

    const duration = performance.now() - timer.startTime;
    this.timers.delete(id);

    // Track the performance metric
    this.sendMetric(timer.name, duration, 'ms', timer.context);
    
    console.log(`[Performance] ${timer.name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const timerId = this.startTimer(name, context);
    
    try {
      const result = await fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T {
    const timerId = this.startTimer(name, context);
    
    try {
      const result = fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Track render time for React components
   */
  trackRenderTime(componentName: string, renderTime: number): void {
    this.sendMetric(
      'component_render',
      renderTime,
      'ms',
      { componentName }
    );

    // Log slow renders
    if (renderTime > 16) { // More than one frame (60 FPS)
      console.warn(`[Performance] Slow render detected: ${componentName} - ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFpsMonitoring(): void {
    const measureFrame = (timestamp: number) => {
      try {
        if (this.lastFrameTime > 0) {
          const delta = timestamp - this.lastFrameTime;
          
          // Only calculate FPS if delta is reasonable (at least 1ms)
          // This prevents extremely high FPS readings from rapid callbacks
          if (delta >= 1) {
            const fps = 1000 / delta;
            
            // Clamp FPS to reasonable range (0-120 FPS)
            const clampedFps = Math.min(Math.max(fps, 0), 120);
            
            this.fpsReadings.push(clampedFps);

            // Keep readings within limit
            if (this.fpsReadings.length > this.MAX_FPS_READINGS) {
              this.fpsReadings.shift();
            }
          }

          // Report FPS less frequently to reduce overhead
          if (this.frameCount % 600 === 0) { // Every 10 seconds instead of 5
            this.reportFps();
          }
        }

        this.lastFrameTime = timestamp;
        this.frameCount++;
        
        // Continue monitoring
        requestAnimationFrame(measureFrame);
      } catch (error) {
        console.error('[Performance] Frame measurement error:', error);
        // Still continue monitoring
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Report FPS metrics
   */
  private reportFps(): void {
    if (this.fpsReadings.length === 0) return;

    const avgFps = this.fpsReadings.reduce((sum, fps) => sum + fps, 0) / this.fpsReadings.length;
    const minFps = Math.min(...this.fpsReadings);
    const maxFps = Math.max(...this.fpsReadings);

    this.sendMetric('fps_average', avgFps, 'count');
    this.sendMetric('fps_minimum', minFps, 'count');
    this.sendMetric('fps_maximum', maxFps, 'count');

    // Log performance warnings
    if (avgFps < 30) {
      console.warn(`[Performance] Low FPS detected: ${avgFps.toFixed(1)} FPS average`);
    }

    console.log(`[Performance] FPS - Avg: ${avgFps.toFixed(1)}, Min: ${minFps.toFixed(1)}, Max: ${maxFps.toFixed(1)}`);
  }

  /**
   * Check memory usage (simplified for React Native)
   */
  private async checkMemoryUsage(): Promise<void> {
    try {
      // In React Native, we can't directly access memory info like in browser
      // This is a simplified implementation for demonstration
      const memoryInfo = await this.getMemoryInfo();
      
      if (memoryInfo) {
        this.sendMetric('memory_used', memoryInfo.used, 'bytes');
        this.sendMetric('memory_percentage', memoryInfo.percentage, '%');
        
        if (memoryInfo.percentage > 80) {
          console.warn(`[Performance] High memory usage: ${memoryInfo.percentage.toFixed(1)}%`);
        }
      }
    } catch (error) {
      console.error('[Performance] Failed to check memory usage:', error);
    }
  }

  /**
   * Get simplified memory info (mock for React Native)
   */
  private async getMemoryInfo(): Promise<MemoryUsage | null> {
    // This is a mock implementation
    // In a real React Native app, you might use a native module to get actual memory info
    return {
      used: Math.random() * 100 * 1024 * 1024, // Random value between 0-100MB
      total: 512 * 1024 * 1024, // 512MB total
      percentage: Math.random() * 100, // Random percentage
    };
  }

  /**
   * Track app launch performance
   */
  trackAppLaunch(launchStartTime: number): void {
    const launchTime = performance.now() - launchStartTime;
    
    this.sendMetric('app_launch_time', launchTime, 'ms');
    
    console.log(`[Performance] App launch time: ${launchTime.toFixed(2)}ms`);
  }

  /**
   * Track navigation performance
   */
  trackNavigation(fromScreen: string, toScreen: string, duration: number): void {
    this.sendMetric('navigation_time', duration, 'ms', {
      fromScreen,
      toScreen,
    });
    
    if (duration > 500) {
      console.warn(`[Performance] Slow navigation: ${fromScreen} → ${toScreen} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * Track list scroll performance
   */
  trackScrollPerformance(listName: string, itemCount: number, scrollDuration: number): void {
    this.sendMetric('scroll_performance', scrollDuration, 'ms', {
      listName,
      itemCount,
    });
  }

  /**
   * Track image load performance
   */
  trackImageLoad(imageUrl: string, loadTime: number, success: boolean): void {
    this.sendMetric('image_load_time', loadTime, 'ms', {
      imageUrl,
      success,
    });
  }

  /**
   * Track API performance
   */
  trackApiPerformance(endpoint: string, method: string, duration: number, status: number): void {
    // Note: API call tracking moved to avoid circular dependency
    this.sendMetric('api_response_time', duration, 'ms', {
      endpoint,
      method,
      status,
    });
    
    // Track specific performance metrics
    if (duration > 5000) {
      console.warn(`[Performance] Slow API call: ${method} ${endpoint} (${duration}ms)`);
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): {
    activeTimers: number;
    averageFps: number;
    frameCount: number;
  } {
    const avgFps = this.fpsReadings.length > 0 
      ? this.fpsReadings.reduce((sum, fps) => sum + fps, 0) / this.fpsReadings.length
      : 0;

    return {
      activeTimers: this.timers.size,
      averageFps: avgFps,
      frameCount: this.frameCount,
    };
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.timers.clear();
    this.fpsReadings = [];
    this.frameCount = 0;
    this.lastFrameTime = 0;
    
    console.log('[Performance] Performance data cleared');
  }
}

// Singleton instance
export const performanceService = PerformanceService.getInstance();