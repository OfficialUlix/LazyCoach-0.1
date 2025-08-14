import { useCallback, useEffect, useRef } from 'react';
import { performanceService } from '../services/PerformanceService';

export interface UsePerformanceResult {
  startTimer: (name: string, context?: Record<string, any>) => string;
  endTimer: (id: string) => number | null;
  measureAsync: <T>(name: string, fn: () => Promise<T>, context?: Record<string, any>) => Promise<T>;
  measure: <T>(name: string, fn: () => T, context?: Record<string, any>) => T;
  trackRenderTime: (componentName: string, renderTime: number) => void;
  trackNavigation: (fromScreen: string, toScreen: string, duration: number) => void;
  trackApiPerformance: (endpoint: string, method: string, duration: number, status: number) => void;
}

export const usePerformance = (): UsePerformanceResult => {
  const startTimer = useCallback((name: string, context?: Record<string, any>) => {
    return performanceService.startTimer(name, context);
  }, []);

  const endTimer = useCallback((id: string) => {
    return performanceService.endTimer(id);
  }, []);

  const measureAsync = useCallback(async <T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return performanceService.measureAsync(name, fn, context);
  }, []);

  const measure = useCallback(<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T => {
    return performanceService.measure(name, fn, context);
  }, []);

  const trackRenderTime = useCallback((componentName: string, renderTime: number) => {
    performanceService.trackRenderTime(componentName, renderTime);
  }, []);

  const trackNavigation = useCallback((fromScreen: string, toScreen: string, duration: number) => {
    performanceService.trackNavigation(fromScreen, toScreen, duration);
  }, []);

  const trackApiPerformance = useCallback((endpoint: string, method: string, duration: number, status: number) => {
    performanceService.trackApiPerformance(endpoint, method, duration, status);
  }, []);

  return {
    startTimer,
    endTimer,
    measureAsync,
    measure,
    trackRenderTime,
    trackNavigation,
    trackApiPerformance,
  };
};

/**
 * Hook to measure component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const { trackRenderTime } = usePerformance();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    trackRenderTime(componentName, renderTime);
  });
};

/**
 * Hook to measure screen navigation performance
 */
export const useScreenPerformance = (screenName: string) => {
  const screenStartTime = useRef<number>(0);
  const previousScreen = useRef<string>('');
  const { trackNavigation } = usePerformance();

  useEffect(() => {
    const startTime = performance.now();
    
    if (previousScreen.current) {
      const navigationTime = startTime - screenStartTime.current;
      trackNavigation(previousScreen.current, screenName, navigationTime);
    }

    screenStartTime.current = startTime;
    previousScreen.current = screenName;
  }, [screenName, trackNavigation]);
};