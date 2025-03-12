// This file is deprecated. Use jose-auth.ts instead.
// Keeping this file temporarily as a reference, but it should be removed 
// after all imports are updated to use jose-auth.ts

import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './jose-auth';

// Re-export the functions from jose-auth for backward compatibility
export { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken };
