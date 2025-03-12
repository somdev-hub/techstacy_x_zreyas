import { Role } from "@prisma/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jose-auth";
import { prisma } from "./prisma";

export const auth = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
    const { payload } = await jwtVerify(token.value, secret);

    if (!payload) {
      return null;
    }

    return {
      user: payload
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

export const checkUserRole = async (userId: string): Promise<Role | null> => {
  try {
    const response = await fetch(`/api/user/${userId}`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await response.json();
    return userData.role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return null;
  }
};

export const redirectBasedOnRole = (role: Role, router: AppRouterInstance) => {
  switch (role) {
    case "SUPERADMIN":
      router.push("/super-admin/home");
      break;
    case "ADMIN":
      router.push("/admin/home");
      break;
    case "USER":
      router.push("/dashboard/home");
      break;
    default:
      router.push("/");
  }
};

export const userFromRequest = async (req: NextRequest) => {
  try {
    const headersList = new Headers(req.headers);
    const cookie = headersList.get("cookie") || "";
    const token = cookie
      .split(";")
      .find((c) => c.trim().startsWith("accessToken="))
      ?.split("=")[1];

    if (!token) {
      return null;
    }

    const decoded = await verifyAccessToken(token);

    if (!decoded.userId || !decoded.email || !decoded.role) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    return user;
  } catch (error) {
    console.error("Error in userFromRequest:", error);
    return null;
  }
};
