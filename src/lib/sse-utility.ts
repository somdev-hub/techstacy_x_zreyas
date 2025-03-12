// Track active connections with connection limits
export const MAX_CONNECTIONS_PER_USER = 3;
export const CLEANUP_INTERVAL = 60000; // 1 minute

export const connections = new Map<number, ReadableStreamDefaultController<string>>();
export const userConnections = new Map<
  number,
  Set<ReadableStreamDefaultController<string>>
>();

export interface NotificationData {
  type: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

// Move the helper functions here
export function getConnectionStats() {
  return {
    totalConnections: connections.size,
    totalUsers: userConnections.size,
    connectionsPerUser: Array.from(userConnections.entries()).map(
      ([userId, controllers]) => ({
        userId,
        connections: controllers.size,
      })
    ),
  };
}

export function sendUserNotification(userId: number, data: NotificationData) {
  const userControllers = userConnections.get(userId);
  if (!userControllers) return;

  const deadControllers = new Set<ReadableStreamDefaultController<string>>();

  userControllers.forEach((controller) => {
    try {
      const message = `data: ${JSON.stringify({
        type: "notification",
        data,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(message);
    } catch (error) {
      console.error("Failed to send notification to user:", userId, error);
      deadControllers.add(controller);
    }
  });

  // Cleanup dead controllers after iteration
  if (deadControllers.size > 0) {
    deadControllers.forEach(controller => {
      userControllers.delete(controller);
    });
    if (userControllers.size === 0) {
      userConnections.delete(userId);
    }
  }
}