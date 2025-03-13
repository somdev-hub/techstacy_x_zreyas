import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jose-auth";

export async function middleware(request: NextRequest) {
  try {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const path = request.nextUrl.pathname;
    const isPublicPath = path === "/" || path.startsWith("/api/auth");

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // Handle authentication for protected routes
    if (!isPublicPath) {
      // If no access token, try refresh token first
      if (!accessToken && refreshToken) {
        const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            Cookie: `refreshToken=${refreshToken}`
          }
        });

        if (refreshResponse.ok) {
          const newResponse = NextResponse.next();
          refreshResponse.headers.getSetCookie().forEach(cookie => {
            newResponse.headers.set('Set-Cookie', cookie);
          });
          return newResponse;
        }
      }

      // If we have an access token, verify it
      if (accessToken) {
        try {
          const payload = await verifyAccessToken(accessToken);
          
          if (!payload || !payload.role) {
            throw new Error("Invalid token payload");
          }

          const currentSection = path.split('/')[1]; 

          const hasAccess = (role: string, section: string) => {
            switch (section) {
              case "super-admin":
                return role === "SUPERADMIN";
              case "admin":
                return role === "ADMIN" || role === "SUPERADMIN";
              case "dashboard":
                return ["USER", "ADMIN", "SUPERADMIN"].includes(role);
              default:
                return false;
            }
          };

          if (!hasAccess(payload.role, currentSection)) {
            const getHomeRoute = (role: string) => {
              switch (role) {
                case "SUPERADMIN":
                  return "/super-admin/home";
                case "ADMIN":
                  return "/admin/home";
                default:
                  return "/dashboard/home";
              }
            };
            
            return NextResponse.redirect(new URL(getHomeRoute(payload.role), request.url));
          }

          return NextResponse.next();

        } catch (error) {
          // On token verification error, try refresh flow if we haven't already
          if (refreshToken && !request.headers.get('x-tried-refresh')) {
            try {
              const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  Cookie: `refreshToken=${refreshToken}`,
                  'x-tried-refresh': '1'
                }
              });

              if (refreshResponse.ok) {
                const newResponse = NextResponse.next();
                refreshResponse.headers.getSetCookie().forEach(cookie => {
                  newResponse.headers.set('Set-Cookie', cookie);
                });
                return newResponse;
              }
            } catch (refreshError) {
              console.error("Token refresh error:", refreshError);
            }
          }

          // If refresh failed or wasn't possible, clear tokens and redirect
          const response = NextResponse.redirect(new URL("/", request.url));
          response.cookies.set({
            name: "accessToken",
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            path: "/"
          });
          response.cookies.set({
            name: "refreshToken", 
            value: "",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            path: "/"
          });
          return response;
        }
      }

      return NextResponse.redirect(new URL("/", request.url));
    }

    // Prevent authenticated users from accessing home page
    if (path === "/" && accessToken) {
      try {
        const payload = await verifyAccessToken(accessToken);
        
        if (payload.role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/super-admin/home", request.url));
        } else if (payload.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin/home", request.url));
        } else {
          return NextResponse.redirect(new URL("/dashboard/home", request.url));
        }
      } catch (error) {
        // If token verification fails on public path, just continue
        return NextResponse.next();
      }
    }

    // Add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/super-admin/:path*"]
};
