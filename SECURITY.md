# Security Documentation

## Authentication System Overview

### Token-Based Authentication
- Uses JSON Web Tokens (JWT) with Jose library for token handling
- Implements dual token system (access + refresh tokens)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Implements token rotation on refresh for enhanced security

### Token Security Measures
- HTTP-only cookies
- Secure flag in production
- SameSite=lax policy
- SHA-256 hashing for refresh tokens in database
- Token payload validation and sanitization

### Rate Limiting & Brute Force Protection
- 5 login attempts per minute per IP
- 1-hour lockout after exceeding attempts
- Uses Upstash Redis for rate limiting
- Sliding window algorithm for rate limiting
- IP-based tracking and lockout mechanism

### Password Security
- Bcrypt hashing with salt rounds of 10
- Constant-time password comparison
- No password strength indicators in responses
- Generic error messages for security

## Security Headers and Cookies

### Cookie Configuration
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: tokenExpiry
}
```

### CSRF Protection
- Implemented using @edge-csrf/nextjs
- 1-hour token TTL
- Secure cookie configuration
- Token validation on sensitive routes

## Role-Based Access Control (RBAC)

### User Roles
- SUPERADMIN: Full system access
- ADMIN: Administrative access
- USER: Standard user access

### Access Control Implementation
- Path-based access control in middleware
- Role validation on protected routes
- Automatic redirection based on role
- Protected route patterns:
  - /dashboard/*
  - /admin/*
  - /super-admin/*

## Session Management

### Session Handling
- Stateless JWT-based sessions
- Refresh token rotation on each use
- Server-side token tracking
- Automatic token refresh mechanism
- Grace period for token refresh

### Session Termination
- Logout invalidates both tokens
- Server-side token invalidation
- Cookie clearing on logout
- Automatic cleanup of expired tokens

## Security Endpoints

### Authentication Endpoints
1. `/api/auth/login`
   - Rate limited
   - IP-based lockout
   - Secure cookie setting
   - Role-based redirection

2. `/api/auth/refresh`
   - Token rotation
   - Validates refresh token hash
   - Atomic database operations
   - Cleans expired tokens

3. `/api/auth/logout`
   - Invalidates active sessions
   - Clears secure cookies
   - Database cleanup

### Protected Routes
- Middleware-based protection
- Token verification
- Role validation
- Automatic token refresh

## Database Security

### Refresh Token Storage
```sql
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   
  tokenHash String   @unique
  userId    Int
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id])
}
```

### Security Features
- Token hashing
- Expiration tracking
- User relationship
- Atomic operations
- Regular cleanup

## Error Handling

### Security Considerations
- Generic error messages
- No sensitive data in responses
- Proper error logging
- Status code consistency

### Common Error Responses
```typescript
{
  status: 401, // Unauthorized
  error: "Invalid credentials"
}
{
  status: 403, // Forbidden
  error: "Insufficient permissions"
}
{
  status: 429, // Too Many Requests
  error: "Rate limit exceeded"
}
```

## Security Best Practices

### Implementation Guidelines
1. **Token Management**
   - Never store in localStorage
   - Use HTTP-only cookies
   - Implement proper rotation
   - Regular token cleanup

2. **Error Handling**
   - Generic error messages
   - Proper error logging
   - No system details exposure

3. **Data Protection**
   - Input validation
   - Output sanitization
   - Proper CORS policies

4. **Monitoring**
   - Login attempt tracking
   - Failed authentication logging
   - Suspicious activity detection

## Security Recommendations

### Immediate Implementation
1. Add additional security headers:
   ```typescript
   {
     'X-Content-Type-Options': 'nosniff',
     'X-Frame-Options': 'SAMEORIGIN',
     'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
   }
   ```

2. Implement request origin validation
3. Add rate limiting for all API endpoints
4. Enable secure websocket connections

### Future Enhancements
1. Implement 2FA support
2. Add device fingerprinting
3. Implement session tracking
4. Add security event logging
5. Implement automatic suspicious activity detection

## Development Guidelines

### Security Checklist
1. Use environment variables for secrets
2. Implement proper error handling
3. Follow secure coding practices
4. Regular dependency updates
5. Security testing implementation

### Deployment Considerations
1. Enable HTTPS only
2. Configure security headers
3. Set up monitoring
4. Regular security audits
5. Backup and recovery planning