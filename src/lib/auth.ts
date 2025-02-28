import { Role } from "@prisma/client";

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

import { NextRouter } from 'next/router';

export const redirectBasedOnRole = (role: Role, router: NextRouter) => {
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
