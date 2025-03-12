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
      // If no access token, try refresh token
      if (!accessToken && refreshToken) {
        try {
          // Call refresh endpoint
          const response = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              Cookie: `refreshToken=${refreshToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Get the new access token from response headers
            const newResponse = NextResponse.next();
            response.headers.getSetCookie().forEach(cookie => {
              if (cookie.startsWith('accessToken=')) {
                newResponse.headers.set('Set-Cookie', cookie);
              }
            });
            return newResponse;
          }
        } catch (error) {
          console.error("Token refresh error:", error);
        }
      }

      if (!accessToken) {
        return NextResponse.redirect(new URL("/", request.url));
      }

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
              return role === "ADMIN";
            case "dashboard":
              return role === "USER";
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

      } catch (error) {
        // On token verification error, try refresh flow
        if (refreshToken) {
          try {
            const response = await fetch(`${request.nextUrl.origin}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                Cookie: `refreshToken=${refreshToken}`
              }
            });

            if (response.ok) {
              const newResponse = NextResponse.next();
              response.headers.getSetCookie().forEach(cookie => {
                if (cookie.startsWith('accessToken=')) {
                  newResponse.headers.set('Set-Cookie', cookie);
                }
              });
              return newResponse;
            }
          } catch (refreshError) {
            console.error("Token refresh error:", refreshError);
          }
        }

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
