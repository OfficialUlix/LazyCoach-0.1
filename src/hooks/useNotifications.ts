import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService, { NotificationData } from '../services/NotificationService';
import { useAuth } from '../context/AuthContext';

export interface UseNotificationsResult {
  isInitialized: boolean;
  pushToken: string | null;
  scheduleSessionReminder: (
    sessionId: string,
    coachName: string,
    sessionDateTime: Date,
    reminderMinutes?: number
  ) => Promise<string | null>;
  cancelSessionNotifications: (sessionId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  scheduledCount: number;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const success = await NotificationService.initialize();
        setIsInitialized(success);
        
        if (success) {
          const token = NotificationService.getExpoPushToken();
          setPushToken(token);
          
          // Update scheduled count
          const scheduled = await NotificationService.getScheduledNotifications();
          setScheduledCount(scheduled.length);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setIsInitialized(false);
      }
    };

    initializeNotifications();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    if (!isInitialized) return;

    // Listen for notification received while app is in foreground
    const notificationListener = NotificationService.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification responses (user tapped notification)
    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data as NotificationData;
        
        // Handle different notification types
        if (data?.type === 'session_reminder' || data?.type === 'session_starting') {
          // Navigate to sessions screen or session detail
          console.log('Session notification tapped:', data);
        } else if (data?.type === 'message_received') {
          // Navigate to messages screen
          console.log('Message notification tapped:', data);
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isInitialized]);

  const scheduleSessionReminder = useCallback(
    async (
      sessionId: string,
      coachName: string,
      sessionDateTime: Date,
      reminderMinutes: number = 60
    ): Promise<string | null> => {
      if (!isInitialized) {
        console.warn('Notifications not initialized');
        return null;
      }

      try {
        // Schedule the main reminder
        const reminderId = await NotificationService.scheduleSessionReminder(
          sessionId,
          coachName,
          sessionDateTime,
          reminderMinutes
        );

        // Schedule a "starting soon" notification
        await NotificationService.scheduleSessionStartingNotification(
          sessionId,
          coachName,
          sessionDateTime
        );

        // Update scheduled count
        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledCount(scheduled.length);

        return reminderId;
      } catch (error) {
        console.error('Failed to schedule session reminder:', error);
        return null;
      }
    },
    [isInitialized]
  );

  const cancelSessionNotifications = useCallback(
    async (sessionId: string): Promise<void> => {
      if (!isInitialized) return;

      try {
        await NotificationService.cancelSessionNotifications(sessionId);
        
        // Update scheduled count
        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledCount(scheduled.length);
      } catch (error) {
        console.error('Failed to cancel session notifications:', error);
      }
    },
    [isInitialized]
  );

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;

    try {
      await NotificationService.clearAllNotifications();
      setScheduledCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    pushToken,
    scheduleSessionReminder,
    cancelSessionNotifications,
    clearAllNotifications,
    scheduledCount,
  };
}