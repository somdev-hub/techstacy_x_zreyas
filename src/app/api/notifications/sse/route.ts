import { NextRequest } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { sseConnectionRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { getConnectionStats } from "@/lib/sse-utility";

// Track active connections with connection limits
const MAX_CONNECTIONS_PER_USER = 3;
const CLEANUP_INTERVAL = 60000; // 1 minute

const connections = new Map<number, ReadableStreamDefaultController<string>>();
const userConnections = new Map<
  number,
  Set<ReadableStreamDefaultController<string>>
>();

interface NotificationData {
  type: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

// Cleanup dead connections periodically
setInterval(() => {
  for (const [userId, controllers] of userConnections.entries()) {
    for (const controller of controllers) {
      try {
        controller.enqueue(''); // Test if controller is still active
      } catch (error) {
        controllers.delete(controller);
        if (controllers.size === 0) {
          userConnections.delete(userId);
        }
      }
    }
  }
}, CLEANUP_INTERVAL);

export async function GET(req: NextRequest) {
  try {
    // Add CORS headers for SSE support
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    });

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const user = await userFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { 
        status: 401,
        headers: { 
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json' 
        }
      });
    }

    // Skip rate limiting for admin users
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      // Check rate limit for regular users
      const rateLimitResult = await checkRateLimit(
        `sse:${user.id}`,
        sseConnectionRateLimit
      );

      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          retryAfter
        }), {
          status: 429,
          headers: {
            ...Object.fromEntries(headers),
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        });
      }
    }

    // Increase connection limit for admin users
    const maxConnections = (user.role === 'ADMIN' || user.role === 'SUPERADMIN') ? 10 : MAX_CONNECTIONS_PER_USER;

    // Check connection limit per user
    const userControllers = userConnections.get(user.id);
    if (userControllers && userControllers.size >= maxConnections) {
      return new Response(JSON.stringify({
        error: "Connection limit exceeded",
        maxConnections,
        currentConnections: userControllers.size
      }), { 
        status: 429,
        headers: { 
          ...Object.fromEntries(headers),
          'Content-Type': 'application/json' 
        }
      });
    }

    // Create SSE stream
    const stream = new ReadableStream<string>({
      start(controller: ReadableStreamDefaultController<string>) {
        const connectionId = Date.now();
        connections.set(connectionId, controller);
        let isConnectionActive = true;
        let lastActivity = Date.now();

        // Store user connection with error handling
        try {
          if (!userConnections.has(user.id)) {
            userConnections.set(user.id, new Set());
          }
          const userSet = userConnections.get(user.id);
          if (!userSet) {
            throw new Error('Failed to initialize user connection set');
          }
          userSet.add(controller);

          // Send initial connection success message
          const data = {
            type: "connection",
            data: { 
              status: "connected", 
              timestamp: new Date().toISOString(),
              connectionStats: getConnectionStats(),
              connectionId,
              userId: user.id,
              role: user.role
            },
          };
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

          // Start heartbeat and activity monitor
          const heartbeat = setInterval(() => {
            if (!isConnectionActive) {
              clearInterval(heartbeat);
              return;
            }

            // Check for connection timeout (5 minutes of inactivity)
            const inactiveTime = Date.now() - lastActivity;
            if (inactiveTime > 5 * 60 * 1000) {
              console.log(`Connection ${connectionId} timed out after ${inactiveTime}ms of inactivity`);
              cleanup("timeout");
              return;
            }

            try {
              const message = JSON.stringify({
                type: "ping",
                timestamp: new Date().toISOString(),
                connectionId
              });
              controller.enqueue(`data: ${message}\n\n`);
              lastActivity = Date.now(); // Update last activity time
            } catch (error) {
              console.error("Heartbeat error:", error);
              isConnectionActive = false;
              clearInterval(heartbeat);
              cleanup("heartbeat_failure");
            }
          }, 30000);

          // Enhanced cleanup function
          const cleanup = (reason: string = "unknown") => {
            try {
              isConnectionActive = false;
              clearInterval(heartbeat);
              connections.delete(connectionId);
              
              const userControllers = userConnections.get(user.id);
              if (userControllers) {
                userControllers.delete(controller);
                if (userControllers.size === 0) {
                  userConnections.delete(user.id);
                }
              }
              
              console.log(`Cleaned up connection ${connectionId} for user ${user.id}. Reason: ${reason}`);
              
              // Send cleanup notification to client
              controller.enqueue(`data: ${JSON.stringify({
                type: "disconnect",
                data: { 
                  reason,
                  timestamp: new Date().toISOString(),
                  connectionId 
                }
              })}\n\n`);
            } catch (cleanupError) {
              console.error("Cleanup error:", cleanupError);
            }
          };

          // Set up connection close handler
          req.signal.addEventListener("abort", () => cleanup("connection_aborted"));
        } catch (setupError) {
          console.error("Connection setup error:", setupError);
          controller.error(setupError);
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

