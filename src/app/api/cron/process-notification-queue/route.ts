import { NextRequest, NextResponse } from 'next/server';
import { processNotificationQueue } from '@/lib/notification-worker';
import { NotificationService } from '@/lib/notification-service';

// Rate limiting settings
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
let lastRun = 0;

/**
 * This endpoint can be called by a scheduled job (e.g., cron job from Vercel or external cron service)
 * to process the notification queue
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key to secure the endpoint
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic rate limiting to prevent multiple concurrent executions
    const now = Date.now();
    if (now - lastRun < RATE_LIMIT_WINDOW) {
      return NextResponse.json({
        message: 'Too many requests, queue processing already in progress'
      }, { status: 429 });
    }

    lastRun = now;
    
    // Process notifications queue
    await processNotificationQueue();
    
    // Clean up old notifications (older than 30 days)
    const deletedCount = await NotificationService.deleteExpiredNotifications(30);
    
    return NextResponse.json({
      message: 'Notification queue processed successfully',
      deletedNotifications: deletedCount
    });
  } catch (error) {
    console.error('Failed to process notification queue:', error);
    return NextResponse.json({ 
      error: 'Failed to process notifications queue' 
    }, { status: 500 });
  }
}