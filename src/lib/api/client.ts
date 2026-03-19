// Admin API client — core utilities shared by all domain modules

// Direct backend URL — used for images (public, no auth needed)
export const DIRECT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// CDN URL for serving images through Cloudflare edge cache
const IMAGE_CDN_URL = process.env.NEXT_PUBLIC_IMAGE_CDN_URL || '';

// Storefront URL for product preview links
export const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";

// In production, route API fetch calls through Next.js rewrite proxy so cookies
// are same-origin — required for mobile Safari which blocks third-party cookies.
export const API_BASE_URL =
  typeof window !== "undefined" && process.env.NODE_ENV === "production"
    ? "/api/proxy"
    : DIRECT_API_URL;
const AUTH_REFRESH_ENDPOINT = "/api/v1/internal/auth/refresh";

/**
 * Resolve an image URL from the backend.
 * Routes through CDN when configured, falls back to backend proxy.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // MinIO URLs → CDN or backend proxy
  if (url.includes("vernont-minio") && url.includes("runixcloud.dev")) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 1) {
        const key = parts.slice(1).join("/"); // strip bucket name
        if (IMAGE_CDN_URL) {
          return `${IMAGE_CDN_URL}/${key}`;
        }
        return `${DIRECT_API_URL}/files?key=${encodeURIComponent(key)}`;
      }
    } catch { /* fall through */ }
  }

  // Other absolute URLs — return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // Relative /files?key= URLs → CDN
  if (url.startsWith("/files?key=") && IMAGE_CDN_URL) {
    const key = decodeURIComponent(url.replace("/files?key=", ""));
    return `${IMAGE_CDN_URL}/${key}`;
  }

  // Relative URLs — prefix with direct API URL
  return `${DIRECT_API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Attempt to refresh the authentication token.
 * Returns true if refresh was successful, false otherwise.
 */
export async function refreshAuthToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch (error) {
      console.error("[API] Token refresh failed:", error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Start proactive token refresh interval.
 * Refreshes the token every 10 minutes to prevent expiration during active sessions.
 */
export function startTokenRefreshInterval(): void {
  if (refreshInterval) {
    return; // Already running
  }

  // Refresh every 10 minutes (tokens typically expire in 15-30 minutes)
  refreshInterval = setInterval(async () => {
    if (typeof window !== "undefined") {
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        console.warn("[API] Proactive token refresh failed - session may expire soon");
      }
    }
  }, 10 * 60 * 1000); // 10 minutes
}

/**
 * Stop proactive token refresh interval.
 */
export function stopTokenRefreshInterval(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Standardized API error response from backend.
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

/**
 * Custom API error class that captures full error details from backend.
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;
  public readonly timestamp?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>,
    requestId?: string,
    timestamp?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = timestamp;
  }

  /**
   * Get field-specific validation errors if available.
   */
  getFieldErrors(): Record<string, string> | undefined {
    if (this.details?.fields) {
      return this.details.fields as Record<string, string>;
    }
    return undefined;
  }

  /**
   * Check if this is an authentication error.
   */
  isAuthError(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED" || this.code === "INVALID_CREDENTIALS";
  }

  /**
   * Check if this is a validation error.
   */
  isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR" || this.code === "INVALID_ARGUMENT" || this.status === 400;
  }

  /**
   * Check if this is a not found error.
   */
  isNotFoundError(): boolean {
    return this.status === 404 || this.code.includes("NOT_FOUND");
  }

  /**
   * Check if this is a conflict/duplicate error.
   */
  isConflictError(): boolean {
    return this.status === 409 || this.code.includes("ALREADY_EXISTS") || this.code === "DUPLICATE_SKU";
  }
}

/**
 * Parse error response from backend.
 */
export async function parseErrorResponse(response: Response): Promise<ApiError> {
  const status = response.status;

  try {
    const errorData = await response.json() as ApiErrorResponse;
    return new ApiError(
      errorData.message || `Request failed with status ${status}`,
      errorData.error || `HTTP_${status}`,
      status,
      errorData.details,
      errorData.requestId,
      errorData.timestamp
    );
  } catch {
    // JSON parsing failed, create basic error
    const message = status === 401
      ? "Authentication required"
      : status === 403
        ? "Access denied"
        : status === 404
          ? "Resource not found"
          : `Request failed with status ${status}`;

    return new ApiError(message, `HTTP_${status}`, status);
  }
}

// Generic API fetch with auth and automatic token refresh
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry: boolean = false
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    // On 401, attempt to refresh token and retry (once)
    if (response.status === 401 && !_isRetry) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the original request
        return apiFetch<T>(endpoint, options, true);
      }
      // Refresh failed - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw await parseErrorResponse(response);
  }

  return response.json();
}

// Format price helper - amounts are in pounds/dollars (major currency unit)
export function formatPrice(amount: number, currencyCode: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount);
}

// Format date helper
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
