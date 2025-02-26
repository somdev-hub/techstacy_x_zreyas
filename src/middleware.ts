import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the path is a protected route
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/api/dashboard');
  
  // If it's not a protected route, proceed with the request
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Get the token from the request cookies
  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    // Redirect to root page if accessing dashboard without a token
    if (path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Return unauthorized for API routes
    if (path.startsWith('/api/dashboard')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Verify the access token
    const payload = await verifyAccessToken(accessToken!);
    if (!payload) {
      // Token is invalid, redirect to root page or return unauthorized
      if (path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (path.startsWith('/api/dashboard')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  } catch (error) {
    // Token verification failed
    console.log(error);
    
    if (path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/api/dashboard')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run for specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/dashboard/:path*'
  ]
};
