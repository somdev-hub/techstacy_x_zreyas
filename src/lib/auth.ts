import { Role } from "@prisma/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const auth = async () => {
  try {
    const cookieStore =await cookies();
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
