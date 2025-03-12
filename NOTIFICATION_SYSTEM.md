# Enhanced Notification System Documentation

This document provides information on the enhanced notification system implemented in the TechStacy x Zreyas application.

## Key Improvements

1. **Singleton Prisma Client**
   - Implemented a singleton Prisma client to prevent connection pool exhaustion
   - Centralized in `/src/lib/prisma.ts` for consistent database access

2. **Notification Queue Processing**
   - Added robust queue processing with retry mechanisms
   - Implemented a cron job endpoint for scheduled processing
   - Added automatic cleanup of expired notifications

3. **Real-time Notifications**
   - Enhanced Server-Sent Events (SSE) implementation
   - Added connection management and heartbeats
   - Implemented reconnection logic on the client side

4. **Improved Security**
   - Added user ownership verification for all notification operations
   - Implemented rate limiting on notification endpoints
   - Added protection against notification spam

5. **Error Handling**
   - Standardized error handling across notification endpoints
   - Added proper logging for critical failures

6. **UX Improvements**
   - Added notification grouping capabilities
   - Implemented notification expiry
   - Preserved important notifications (like team invites) during clear operations

## Key Components

### Notification Service (`/src/lib/notification-service.ts`)

A centralized service that handles all notification-related operations:

```typescript
// Example: Creating a notification
await NotificationService.createNotification({
  userId: user.id,
  title: "New Event",
  message: "A new event has been added!",
  type: NotificationType.GENERAL,
  metadata: { eventId: event.id }
});
```

Key methods:
- `createNotification`: Creates a notification with optional push notification
- `sendBulkNotifications`: Sends notifications to multiple users
- `markAsRead`: Marks a notification as read
- `clearNotifications`: Clears notifications while preserving important ones
- `getRecentNotifications`: Gets recent notifications for a user
- `hasUnreadNotifications`: Checks if a user has unread notifications
- `deleteExpiredNotifications`: Deletes expired notifications

### Notification Worker (`/src/lib/notification-worker.ts`)

Handles processing of the notification queue:

```typescript
// Example: Processing the notification queue
await processNotificationQueue();
```

Features:
- Batch processing
- Retry mechanism with exponential backoff
- Error handling and logging

### Cron Job (`/src/app/api/cron/process-notification-queue/route.ts`)

An API endpoint for scheduled processing of the notification queue:

```
GET /api/cron/process-notification-queue
```

Features:
- API key authentication
- Rate limiting to prevent concurrent executions
- Automatic cleanup of expired notifications

### Server-Sent Events (`/src/app/api/notifications/sse/route.ts`)

A real-time notification channel using Server-Sent Events:

```typescript
// Example: Sending a notification via SSE
sendUserNotification(userId, { 
  type: 'notification', 
  data: { id: 1, message: 'New notification!' } 
});
```

Features:
- Connection management with heartbeats
- User-specific channels
- Connection limiting to prevent DoS
- Automatic cleanup of stale connections

### NotificationContext (`/src/context/NotificationContext.tsx`)

A React context for handling notifications on the client side:

```jsx
// Example: Using the notification context
const { 
  notifications, 
  hasUnreadNotifications, 
  markAsRead 
} = useNotifications();
```

Features:
- SSE integration for real-time updates
- Automatic reconnection on connection loss
- Optimistic UI updates

## API Endpoints

### `/api/notifications`

- **GET**: Get a user's notifications
  - Optional Query Params:
    - `limit`: Maximum number of notifications to retrieve (default: 50, max: 100)
    - `includeRead`: Whether to include read notifications (default: false)

### `/api/notifications/:id/read`

- **POST**: Mark a notification as read

### `/api/notifications/clear`

- **POST**: Clear a user's notifications, preserving unread team invites

### `/api/notifications/respond`

- **POST**: Respond to a team invite notification
  - Body:
    ```json
    {
      "notificationId": 123,
      "accept": true|false
    }
    ```

### `/api/notifications/sse`

- **GET**: Connect to the SSE endpoint for real-time notifications

## Best Practices

1. **Use the Notification Service**
   - Always use `NotificationService` instead of directly creating notifications
   - This ensures proper error handling and queue management

2. **Bulk Notifications**
   - For notifications to multiple users, use `sendBulkNotifications` instead of multiple calls to `createNotification`
   - This optimizes database operations

3. **Notification Types**
   - Use appropriate notification types (`TEAM_INVITE`, `EVENT_REMINDER`, `GENERAL`)
   - This helps with filtering and special handling of certain notifications

4. **Metadata**
   - Include relevant metadata with notifications
   - This allows for rich interactions like accepting/declining team invites

5. **Error Handling**
   - Always catch and handle errors from notification operations
   - Use try/catch blocks when interacting with notification APIs

6. **Security**
   - Always verify user ownership before performing notification operations
   - Don't expose sensitive information in notification content

## Maintenance Tasks

1. **Monitoring Queue Performance**
   - Regularly check the notification queue size and processing time
   - Consider adjusting batch size if needed

2. **Expired Notifications**
   - The system automatically cleans up notifications older than 30 days
   - This can be adjusted in `deleteExpiredNotifications` parameter

3. **Rate Limiting**
   - The system includes rate limiting to prevent abuse
   - Adjust rate limits in the API endpoints if needed