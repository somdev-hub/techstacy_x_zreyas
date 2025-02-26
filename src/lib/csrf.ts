import { createCsrfProtect } from "@edge-csrf/nextjs";

export const csrfProtection = createCsrfProtect({
  cookie: {
    name: "csrf",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  },
  // Increase the token TTL to a reasonable value to improve UX
  ttl: 60 * 60, // 1 hour
  // Use strong secrets in production
  secret:
    process.env.CSRF_SECRET ||
    "this-is-a-secret-value-with-at-least-32-characters"
});
