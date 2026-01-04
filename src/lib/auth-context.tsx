"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AUTH_CONFIG,
  InternalUserInfo,
  LoginRequest,
  AuthResponse,
  AuthError,
} from "./auth";

type AuthState = {
  user: InternalUserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextType = AuthState & {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  // Track if we just authenticated via login (to prevent re-fetch on navigation)
  const justAuthenticatedRef = useRef(false);
  // Track if initial auth check has been done
  const initialCheckDoneRef = useRef(false);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Fetch current user
  const fetchUser = useCallback(async (): Promise<InternalUserInfo | null> => {
    try {
      const response = await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry fetching user after refresh
            const retryResponse = await fetch(
              `${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }, []);

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.refresh}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  };

  // Login
  const login = useCallback(
    async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log("[AuthContext] login() called");
        const response = await fetch(
          `${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.login}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          }
        );

        console.log("[AuthContext] Response status:", response.status);

        if (!response.ok) {
          const errorData: AuthError = await response.json();
          console.log("[AuthContext] Login failed:", errorData);
          return { success: false, error: errorData.message };
        }

        const data: AuthResponse = await response.json();
        console.log("[AuthContext] Login success, user:", data.user);

        // Mark as just authenticated to prevent re-fetch on navigation
        justAuthenticatedRef.current = true;
        initialCheckDoneRef.current = true;

        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });

        console.log("[AuthContext] State updated, returning success");
        return { success: true };
      } catch (error) {
        console.error("[AuthContext] Login error:", error);
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.logout}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Reset auth tracking refs
      justAuthenticatedRef.current = false;
      initialCheckDoneRef.current = false;

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.push("/login");
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    const user = await fetchUser();
    setState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
    });
  }, [fetchUser]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      console.log("[AuthContext] initAuth running, isPublicRoute:", isPublicRoute, "pathname:", pathname);

      // Skip auth check on public routes during initial load
      if (isPublicRoute) {
        console.log("[AuthContext] Skipping auth check on public route");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // If we just authenticated via login, skip the re-fetch
      // The state is already set correctly from the login response
      if (justAuthenticatedRef.current) {
        console.log("[AuthContext] Just authenticated, skipping re-fetch");
        justAuthenticatedRef.current = false; // Reset for future use
        return;
      }

      console.log("[AuthContext] Fetching user...");
      const user = await fetchUser();
      console.log("[AuthContext] fetchUser returned:", user);
      initialCheckDoneRef.current = true;

      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });

      // Redirect to login if not authenticated and not on public route
      if (!user && !isPublicRoute) {
        console.log("[AuthContext] No user, redirecting to login");
        router.push("/login");
      }
    };

    initAuth();
  }, [fetchUser, isPublicRoute, router]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    console.log("[AuthContext] Redirect effect - isAuthenticated:", state.isAuthenticated, "isPublicRoute:", isPublicRoute, "pathname:", pathname);
    if (state.isAuthenticated && isPublicRoute && pathname === "/login") {
      console.log("[AuthContext] Redirecting authenticated user from login to /");
      router.push("/");
    }
  }, [state.isAuthenticated, isPublicRoute, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
