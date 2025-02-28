import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuthRedirect() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include"
        });

        if (response.ok) {
          const userData = await response.json();
          console.log("User is authenticated:", userData);

          // Redirect based on user role
          switch (userData.role) {
            case "SUPERADMIN":
              router.push("/super-admin/home");
              break;
            case "ADMIN":
              router.push("/admin/home");
              break;
            default:
              router.push("/dashboard/home");
          }
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, redirect to login as a fallback
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  return { isLoading };
}
