import { prisma } from './prisma';
import { sendNotification } from './firebase-admin';
import { Notification, NotificationType } from '@prisma/client';
import { processNotificationQueue } from './notification-worker';

interface NotificationMetadata {
  type?: string;
  eventId?: string;
  response?: string;
  [key: string]: string | undefined;
}

interface NotificationInput {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: NotificationMetadata;
}

/**
 * Service to handle notification operations
 */
export class NotificationService {
  /**
   * Create a notification with optional push notification
   */
  static async createNotification({
    userId,
    title,
    message,
    type = 'GENERAL' as NotificationType,
    metadata = {},
    sendPush = true // Whether to send a push notification
  }: NotificationInput & { sendPush?: boolean }): Promise<Notification> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fcmToken: true }
      });

      if (!user) {
        throw new Error(`User with ID ${userId} does not exist`);
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          metadata,
          isRead: false
        }
      });

      // Send push notification if requested and FCM token exists
      if (sendPush && user.fcmToken) {
        try {
          await sendNotification(
            user.fcmToken,
            title,
            message,
            {
              notificationId: notification.id.toString(),
              type: type,
              ...metadata
            }
          );
        } catch (error) {
          console.error(`Failed to send push notification to user ${userId}:`, error);
          // Add to notification queue for retry
          await this.queueNotification({ userId, title, message, type, metadata });
        }
      } else if (sendPush) {
        // If FCM token is missing but push was requested, queue it
        await this.queueNotification({ userId, title, message, type, metadata });
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotifications({
    userIds,
    title,
    message,
    type = 'GENERAL' as NotificationType,
    metadata = {}
  }: {
    userIds: number[];
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: NotificationMetadata;
  }): Promise<number> {
    try {
      // Queue notifications for all users
      await Promise.all(userIds.map(userId =>
        this.queueNotification({ userId, title, message, type, metadata })
      ));

      // Create database notifications for all users
      const result = await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          title,
          message,
          type,
          metadata,
          isRead: false
        }))
      });

      // Trigger queue processing
      processNotificationQueue();
      
      return result.count;
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    try {
      // Ensure the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found or does not belong to user ${userId}`);
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * Clear notifications for a user
   */
  static async clearNotifications(userId: number): Promise<number> {
    try {
      // Don't delete unread team invites
      const result = await prisma.notification.deleteMany({
        where: {
          userId: userId,
          NOT: {
            AND: [
              { type: 'TEAM_INVITE' },
              { isRead: false }
            ]
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error(`Failed to clear notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Queue a notification for processing
   */
  static async queueNotification({
    userId,
    title,
    message,
    type = 'GENERAL' as NotificationType,
    metadata = {}
  }: NotificationInput): Promise<void> {
    try {
      await prisma.notificationQueue.create({
        data: {
          userId,
          title,
          message,
          type,
          metadata,
          sent: false
        }
      });
    } catch (error) {
      console.error(`Failed to queue notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to retrieve (default: 50)
   * @param includedTypes Types of notifications to include (default: all)
   */
  static async getRecentNotifications(
    userId: number, 
    limit = 50,
    includedTypes?: NotificationType[]
  ): Promise<Notification[]> {
    try {
      const whereClause: any = { userId };
      
      if (includedTypes && includedTypes.length > 0) {
        whereClause.type = { in: includedTypes };
      }
      
      return await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error(`Failed to get notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has unread notifications
   */
  static async hasUnreadNotifications(userId: number): Promise<boolean> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
      return count > 0;
    } catch (error) {
      console.error(`Failed to check unread notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete expired notifications (older than specified days)
   * @param daysToKeep Number of days to keep notifications
   */
  static async deleteExpiredNotifications(daysToKeep = 30): Promise<number> {
    try {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - daysToKeep);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: expiredDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error(`Failed to delete expired notifications:`, error);
      throw error;
    }
  }
}