import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { userFromRequest } from '@/lib/auth';

// Store active notification connections
const clients = new Set<{
  userId: number;
  controller: ReadableStreamDefaultController;
}>();

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      clients.add({ userId: user.id, controller });

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(data);
    },
    cancel() {
      clients.forEach(client => {
        if (client.userId === user.id) {
          clients.delete(client);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to send notifications to specific users
export async function sendUserNotification(userId: number, notification: any) {
  clients.forEach(client => {
    if (client.userId === userId) {
      const data = `data: ${JSON.stringify(notification)}\n\n`;
      client.controller.enqueue(data);
    }
  });
}