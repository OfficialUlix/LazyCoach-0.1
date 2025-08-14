import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe Device import with fallback
let Device: any = null;
try {
  Device = require('expo-device');
} catch (error) {
  console.warn('[NotificationService] expo-device not available, using fallback');
}
import { storage } from '../utils/storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  sessionId: string;
  coachName: string;
  sessionTime: string;
  type: 'session_reminder' | 'session_starting' | 'session_cancelled' | 'message_received';
  senderId?: string;
  conversationId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize();
    }
    
    return await this.initializationPromise;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Check if notifications are supported
      if (!Device || !Device.isDevice) {
        console.warn('[NotificationService] Push notifications are not supported on simulator or Device module not available');
        this.isInitialized = true;
        return false;
      }

      // Request permission with timeout
      const permissionTimeout = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Permission request timeout')), 10000)
      );
      
      const permissionPromise = (async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        return finalStatus === 'granted';
      })();

      const hasPermission = await Promise.race([permissionPromise, permissionTimeout]);
      
      if (!hasPermission) {
        console.warn('[NotificationService] Notification permissions not granted');
        this.isInitialized = true;
        return false;
      }

      // Get Expo push token with error handling
      if (Constants.easConfig?.projectId) {
        try {
          const tokenTimeout = new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Token request timeout')), 15000)
          );
          
          const tokenPromise = Notifications.getExpoPushTokenAsync({
            projectId: Constants.easConfig.projectId,
          });

          const token = await Promise.race([tokenPromise, tokenTimeout]);
          this.expoPushToken = token.data;
          console.log('[NotificationService] Expo push token obtained:', this.expoPushToken);

          // Store token in storage for backend integration
          await storage.setItem('expoPushToken', this.expoPushToken!);
        } catch (tokenError) {
          console.error('[NotificationService] Failed to get push token:', (tokenError as Error).message);
          // Continue initialization even without push token
        }
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('session-reminders', {
            name: 'Session Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0066CC',
            sound: 'default',
          });
        } catch (channelError) {
          console.error('[NotificationService] Failed to create notification channel:', (channelError as Error).message);
        }
      }

      this.isInitialized = true;
      console.log('[NotificationService] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[NotificationService] Error initializing notifications:', (error as Error).message);
      this.isInitialized = true; // Mark as initialized even on failure to prevent retry loops
      return false;
    }
  }

  async scheduleSessionReminder(
    sessionId: string,
    coachName: string,
    sessionDateTime: Date,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, skipping reminder scheduling');
      return null;
    }
    
    try {
      const reminderTime = new Date(sessionDateTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.warn('Reminder time is in the past, not scheduling');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Session Reminder',
          body: `Your session with ${coachName} starts in ${reminderMinutes} minutes!`,
          sound: 'default',
          data: {
            sessionId,
            coachName,
            sessionTime: sessionDateTime.toISOString(),
            type: 'session_reminder',
          } as NotificationData,
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.floor((reminderTime.getTime() - Date.now()) / 1000) 
        },
      });

      console.log(`Scheduled reminder for session ${sessionId} at ${reminderTime}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling session reminder:', error);
      return null;
    }
  }

  async scheduleSessionStartingNotification(
    sessionId: string,
    coachName: string,
    sessionDateTime: Date
  ): Promise<string | null> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, skipping session starting notification');
      return null;
    }
    
    try {
      const notificationTime = new Date(sessionDateTime.getTime() - 5 * 60 * 1000); // 5 minutes before
      
      if (notificationTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚀 Session Starting Soon',
          body: `Your session with ${coachName} starts in 5 minutes. Get ready!`,
          sound: 'default',
          data: {
            sessionId,
            coachName,
            sessionTime: sessionDateTime.toISOString(),
            type: 'session_starting',
          } as NotificationData,
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.floor((notificationTime.getTime() - Date.now()) / 1000) 
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling session starting notification:', error);
      return null;
    }
  }

  async cancelSessionNotifications(sessionId: string): Promise<void> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, skipping notification cancellation');
      return;
    }
    
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find notifications for this session
      const sessionNotifications = scheduledNotifications.filter(
        notification => 
          notification.content.data && 
          (notification.content.data as NotificationData).sessionId === sessionId
      );

      // Cancel them
      for (const notification of sessionNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`Cancelled ${sessionNotifications.length} notifications for session ${sessionId}`);
    } catch (error) {
      console.error('Error cancelling session notifications:', error);
    }
  }

  async sendMessageNotification(
    senderName: string,
    message: string,
    senderId: string,
    conversationId: string
  ): Promise<void> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, skipping message notification');
      return;
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💬 New message from ${senderName}`,
          body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
          sound: 'default',
          data: {
            type: 'message_received' as const,
            sessionId: '',
            coachName: senderName,
            sessionTime: new Date().toISOString(),
            senderId,
            conversationId,
          } as NotificationData,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, returning empty notifications');
      return [];
    }
    
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async clearAllNotifications(): Promise<void> {
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      console.warn('[NotificationService] Service not initialized, skipping notification clearing');
      return;
    }
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      console.log('Cleared all notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Add notification response listeners
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export default NotificationService.getInstance();