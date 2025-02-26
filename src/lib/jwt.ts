import * as jose from 'jose';

// Token payload types
interface TokenPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

// Check if required environment variables are set
const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

if (!accessTokenSecret || !refreshTokenSecret) {
  console.error("ERROR: JWT secrets not configured in environment variables");
}

// Convert string secrets to Uint8Array for jose
const getSecretKey = (secret: string) => new TextEncoder().encode(secret);

/**
 * Generate an access token
 */
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // 15 minutes
    .sign(getSecretKey(accessTokenSecret!));
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(getSecretKey(refreshTokenSecret!));
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(
      token,
      getSecretKey(accessTokenSecret!)
    );
    return payload as TokenPayload;
  } catch (error) {
    console.log(error);
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(
      token,
      getSecretKey(refreshTokenSecret!)
    );
    return payload as TokenPayload;
  } catch (error) {
    console.log(error);
    return null;
  }
}
