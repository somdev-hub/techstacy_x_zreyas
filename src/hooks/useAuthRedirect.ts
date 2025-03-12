import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuthRedirect() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const role = await fetchUser();

        if (role) {
          console.log("User is authenticated:", role);

          // Redirect based on user role
          switch (role) {
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

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/me', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
  
        const { role } = await response.json();
        return role;
      } catch (_error) {
        return null;
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return { isLoading };
}
