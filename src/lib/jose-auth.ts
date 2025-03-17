import * as jose from 'jose';

// Token payload interface
export interface TokenPayload extends jose.JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Constants
const ACCESS_TOKEN_TTL = '12h';
const REFRESH_TOKEN_TTL = '7d';

// Use static secrets for development (in production, use environment variables)
const accessSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'default_access_secret_for_development_only'
);

const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_for_development_only'
);

// Validate and sanitize payload before token creation
function validateAndSanitizePayload(payload: any): TokenPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }

  const sanitizedPayload: TokenPayload = {
    userId: String(payload.userId || ''),
    email: String(payload.email || ''),
    role: String(payload.role || ''),
    iat: Math.floor(Date.now() / 1000)
  };

  if (!sanitizedPayload.userId) {
    throw new Error('Payload must contain userId');
  }

  if (!sanitizedPayload.email) {
    throw new Error('Payload must contain email');
  }

  if (!sanitizedPayload.role) {
    throw new Error('Payload must contain role');
  }

  return sanitizedPayload;
}

/**
 * Generate access token using jose
 */
export async function createAccessToken(payload: TokenPayload): Promise<string> {
  try {
    if (!payload) {
      throw new Error('Payload cannot be null or undefined');
    }

    const validatedPayload = validateAndSanitizePayload(payload);
    // console.log('Creating access token with payload:', validatedPayload);
    
    // Create a JWT with jose
    const token = await new jose.SignJWT(validatedPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_TTL)
      .sign(accessSecret);
      
    return token;
  } catch (error) {
    console.error('Error creating access token:', error);
    throw new Error(`Failed to create access token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate refresh token using jose
 */
export async function createRefreshToken(payload: TokenPayload): Promise<string> {
  try {
    if (!payload) {
      throw new Error('Payload cannot be null or undefined');
    }

    const validatedPayload = validateAndSanitizePayload(payload);
    // console.log('Creating refresh token with payload:', validatedPayload);
    
    // Create a JWT with jose
    const token = await new jose.SignJWT(validatedPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_TTL)
      .sign(refreshSecret);
      
    return token;
  } catch (error) {
    console.error('Error creating refresh token:', error);
    throw new Error(`Failed to create refresh token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, accessSecret);
    const validatedPayload = validateAndSanitizePayload(payload);
    return validatedPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    throw new Error(`Invalid access token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jose.jwtVerify(token, refreshSecret);
    const validatedPayload = validateAndSanitizePayload(payload);
    return validatedPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    throw new Error(`Invalid refresh token: ${error instanceof Error ? error.message : String(error)}`);
  }
}