import jwt from "jsonwebtoken";

// Simple type for token payload
interface TokenPayload {
  id: string;  // Changed from userId to id
  email: string;
  role: string;
}

// Hard-code secrets for testing to eliminate environment variables as the issue
const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "fallback_access_secret_for_development_only";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "fallback_refresh_secret_for_development_only";

// Simple, direct implementation
export function generateAccessToken(payload: TokenPayload): string {
  console.log("Access token payload:", payload);
  console.log(
    "Using ACCESS_SECRET:",
    ACCESS_SECRET ? "Secret available" : "SECRET MISSING"
  );

  // Simple implementation without try-catch for clarity
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: TokenPayload): string {
  console.log("Refresh token payload:", payload);
  console.log(
    "Using REFRESH_SECRET:",
    REFRESH_SECRET ? "Secret available" : "SECRET MISSING"
  );

  // Simple implementation without try-catch for clarity
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

// Simplified verification functions
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
