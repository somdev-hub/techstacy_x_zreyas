import { prisma } from './prisma';
import { Notification, NotificationType } from '@prisma/client';

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

export class NotificationService {
  static async createNotification({
    userId,
    title,
    message,
    type = 'GENERAL' as NotificationType,
    metadata = {}
  }: NotificationInput): Promise<Notification> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`User with ID ${userId} does not exist`);
      }

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

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

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
      
      return result.count;
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    try {
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

  static async clearNotifications(userId: number): Promise<number> {
    try {
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

  static async deleteExpiredNotifications(olderThanDays: number = 30): Promise<number> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - olderThanDays);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: date
          },
          isRead: true,
          NOT: {
            type: 'TEAM_INVITE'
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to delete expired notifications:', error);
      throw error;
    }
  }
}