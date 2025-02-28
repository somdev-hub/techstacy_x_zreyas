import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jose-auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const isPublicPath = path === "/" || path.startsWith("/api/auth");

  // Get the token from cookies
  const token = request.cookies.get("accessToken")?.value;

  // Handle authentication for protected routes
  if (!isPublicPath) {
    if (!token || token === "") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      // Verify the token and get payload
      const payload = await verifyAccessToken(token);
      
      if (!payload || !payload.role) {
        throw new Error("Invalid token payload");
      }

      // Get the user's home route based on their role
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

      // Role-based route protection
      if (path.startsWith("/super-admin")) {
        if (payload.role !== "SUPERADMIN") {
          // Redirect non-superadmins to their home page
          return NextResponse.redirect(new URL(getHomeRoute(payload.role), request.url));
        }
      } else if (path.startsWith("/admin")) {
        if (payload.role !== "ADMIN") {
          // Redirect non-admins to their home page
          return NextResponse.redirect(new URL(getHomeRoute(payload.role), request.url));
        }
      } else if (path.startsWith("/dashboard")) {
        if (["ADMIN", "SUPERADMIN"].includes(payload.role)) {
          // Redirect admins and superadmins to their home page
          return NextResponse.redirect(new URL(getHomeRoute(payload.role), request.url));
        }
      }

    } catch {
      // On any token verification error, clear the invalid token and redirect to login
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
  if (path === "/" && token) {
    try {
      const payload = await verifyAccessToken(token);
      
      // Redirect to appropriate dashboard based on role
      if (payload.role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/super-admin/home", request.url));
      } else if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/home", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard/home", request.url));
      }
    } catch {
      // If token is invalid, clear it and allow access to home page
      const response = NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/super-admin/:path*"]
};
