// Auth configuration and utilities for internal admin users

export const AUTH_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  endpoints: {
    login: "/api/v1/internal/auth/login",
    me: "/api/v1/internal/auth/me",
    logout: "/api/v1/internal/auth/logout",
    refresh: "/api/v1/internal/auth/refresh",
  },
  // Admin roles that can access the dashboard
  adminRoles: ["ADMIN", "CUSTOMER_SERVICE", "WAREHOUSE_MANAGER", "DEVELOPER"],
};

// Internal user info returned from auth endpoints
export type InternalUserInfo = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string; // Primary role: ADMIN, DEVELOPER, CUSTOMER_SERVICE, WAREHOUSE_MANAGER
};

// Login request
export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

// Auth response (login/refresh)
export type AuthResponse = {
  user: InternalUserInfo;
};

// Auth error response
export type AuthError = {
  error: string;
  message: string;
};

export function isAdminUser(user: InternalUserInfo | null): boolean {
  if (!user) return false;
  return AUTH_CONFIG.adminRoles.includes(user.role);
}

export function getUserDisplayName(user: InternalUserInfo | null): string {
  if (!user) return "";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  return user.email.split("@")[0];
}

export function getUserInitials(user: InternalUserInfo | null): string {
  if (!user) return "?";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800";
    case "DEVELOPER":
      return "bg-purple-100 text-purple-800";
    case "CUSTOMER_SERVICE":
      return "bg-blue-100 text-blue-800";
    case "WAREHOUSE_MANAGER":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "DEVELOPER":
      return "Developer";
    case "CUSTOMER_SERVICE":
      return "Customer Service";
    case "WAREHOUSE_MANAGER":
      return "Warehouse Manager";
    default:
      return role;
  }
}

// Profile update types
export type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// Update the current user's profile
export async function updateProfile(data: UpdateProfileRequest): Promise<InternalUserInfo> {
  const response = await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update profile");
  }

  return response.json();
}

// Change the current user's password
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const response = await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}/password`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to change password");
  }
}
