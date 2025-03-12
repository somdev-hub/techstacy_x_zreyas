import { prisma } from './prisma';
import { sendNotification } from './firebase-admin';
import { NotificationQueue } from '@prisma/client';

// Configuration
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

interface QueueItem extends NotificationQueue {
  user: {
    fcmToken?: string | null;
  };
}

/**
 * Process the notification queue in batches
 */
export async function processNotificationQueue() {
  try {
    // Get unprocessed notifications up to the batch size
    const notifications = await prisma.notificationQueue.findMany({
      where: { 
        sent: false
      },
      take: BATCH_SIZE,
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (notifications.length === 0) {
      console.log('No notifications to process');
      return;
    }

    console.log(`Processing ${notifications.length} notifications`);
    
    // Process each notification
    for (const notification of notifications) {
      await processNotification(notification);
    }
  } catch (error) {
    console.error('Error processing notification queue:', error);
  }
}

/**
 * Process a single notification with retry mechanism
 */
async function processNotification(notification: NotificationQueue, retryCount = 0) {
  try {
    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { fcmToken: true }
    });

    // If the user has no FCM token, mark as sent but log the issue
    if (!user?.fcmToken) {
      console.warn(`User ${notification.userId} has no FCM token. Marking notification as sent.`);
      await markAsSent(notification.id);
      
      // Create a normal notification in the database so it shows in the UI
      await createDatabaseNotification(notification);
      return;
    }

    // Send the notification via Firebase
    await sendNotification(
      user.fcmToken,
      notification.title,
      notification.message,
      { notificationId: notification.id.toString() }
    );

    // Also create a normal notification in the database so it shows in the UI
    await createDatabaseNotification(notification);

    // Mark as sent
    await markAsSent(notification.id);
    
    console.log(`Successfully sent notification ${notification.id} to user ${notification.userId}`);
  } catch (error) {
    console.error(`Error sending notification ${notification.id}:`, error);
    
    // Retry if not exceeded max retries
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying notification ${notification.id} (${retryCount + 1}/${MAX_RETRIES})...`);
      setTimeout(() => {
        processNotification(notification, retryCount + 1);
      }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
    } else {
      console.error(`Failed to send notification ${notification.id} after ${MAX_RETRIES} retries`);
      
      // Still create a database notification so it's visible in the UI
      await createDatabaseNotification(notification);
      
      // Mark as sent to prevent further retries
      await markAsSent(notification.id);
    }
  }
}

/**
 * Mark a notification as sent
 */
async function markAsSent(id: number) {
  await prisma.notificationQueue.update({
    where: { id },
    data: { 
      sent: true,
      sentAt: new Date()
    }
  });
}

/**
 * Create a database notification from a queue notification
 */
async function createDatabaseNotification(queueNotification: NotificationQueue) {
  await prisma.notification.create({
    data: {
      userId: queueNotification.userId,
      title: queueNotification.title,
      message: queueNotification.message,
      type: queueNotification.type,
      metadata: queueNotification.metadata || {},
      isRead: false
    }
  });
}