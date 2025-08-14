import { useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '../services/AnalyticsService';
import { useAuth } from '../context/AuthContext';

export interface UseAnalyticsResult {
  track: (eventName: string, properties?: Record<string, any>) => void;
  trackScreenView: (screenName: string) => void;
  trackAction: (action: string, target: string, context?: Record<string, any>) => void;
  trackSearch: (query: string, results: number, filters?: Record<string, any>) => void;
  trackBooking: (coachId: string, sessionType: string, price: number) => void;
  trackMessage: (conversationId: string, messageLength: number, isFirstMessage: boolean) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, unit: 'ms' | 'bytes' | 'count' | '%', context?: Record<string, any>) => void;
}

export const useAnalytics = (): UseAnalyticsResult => {
  const { user } = useAuth();
  const userIdRef = useRef<string | undefined>();

  // Update analytics user info when user changes
  useEffect(() => {
    if (user && user.id !== userIdRef.current) {
      userIdRef.current = user.id;
      analyticsService.setUserId(user.id, {
        name: user.name,
        email: user.email,
        userType: user.userType,
        registrationDate: new Date().toISOString(),
      });
    }
  }, [user]);

  const track = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    analyticsService.track(eventName, properties);
  }, []);

  const trackScreenView = useCallback((screenName: string) => {
    analyticsService.trackScreenView(screenName);
  }, []);

  const trackAction = useCallback((action: string, target: string, context?: Record<string, any>) => {
    analyticsService.trackAction({ action, target, context });
  }, []);

  const trackSearch = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    analyticsService.trackSearch(query, results, filters);
  }, []);

  const trackBooking = useCallback((coachId: string, sessionType: string, price: number) => {
    analyticsService.trackBooking(coachId, sessionType, price);
  }, []);

  const trackMessage = useCallback((conversationId: string, messageLength: number, isFirstMessage: boolean) => {
    analyticsService.trackMessage(conversationId, messageLength, isFirstMessage);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analyticsService.trackError(error, context);
  }, []);

  const trackPerformance = useCallback((
    metric: string, 
    value: number, 
    unit: 'ms' | 'bytes' | 'count' | '%', 
    context?: Record<string, any>
  ) => {
    analyticsService.trackPerformance(metric, value, unit, context);
  }, []);

  return {
    track,
    trackScreenView,
    trackAction,
    trackSearch,
    trackBooking,
    trackMessage,
    trackError,
    trackPerformance,
  };
};