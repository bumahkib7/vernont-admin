import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ADMIN_VERSION = process.env.npm_package_version || "0.1.0";

interface ServiceCheck {
  status: "up" | "down";
  responseTimeMs: number;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

async function checkBackendRoot(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const elapsed = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        status: "down",
        responseTimeMs: elapsed,
        error: `Backend returned HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as { status?: string; message?: string };
    return {
      status: "up",
      responseTimeMs: elapsed,
      message: body.message,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      status: "down",
      responseTimeMs: elapsed,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkActuatorHealth(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const res = await fetch(`${BACKEND_URL}/actuator/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const elapsed = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        status: "down",
        responseTimeMs: elapsed,
        error: `Actuator returned HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as Record<string, unknown>;
    return {
      status: "up",
      responseTimeMs: elapsed,
      details: body,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      status: "down",
      responseTimeMs: elapsed,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkWebSocket(): Promise<ServiceCheck> {
  const wsUrl = BACKEND_URL.replace(/^http/, "ws");
  const start = performance.now();
  try {
    // We cannot open a real WebSocket in a server-side route handler,
    // so we probe the HTTP upgrade endpoint instead (SockJS info endpoint).
    const res = await fetch(`${BACKEND_URL}/ws/info`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const elapsed = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        status: "down",
        responseTimeMs: elapsed,
        error: `WebSocket endpoint returned HTTP ${res.status}`,
      };
    }

    return {
      status: "up",
      responseTimeMs: elapsed,
      message: `WebSocket endpoint available at ${wsUrl}/ws`,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    return {
      status: "down",
      responseTimeMs: elapsed,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Verify the caller is authenticated by checking for a session cookie.
 * Returns true if a valid session cookie is present.
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();

  // Check for common session cookie names used by the backend
  const sessionCookie =
    cookieStore.get("SESSION") ||
    cookieStore.get("JSESSIONID") ||
    cookieStore.get("access_token");

  if (sessionCookie?.value) {
    return true;
  }

  // Also accept an Authorization header
  const authHeader = request.headers.get("Authorization");
  return !!authHeader?.startsWith("Bearer ");
}

export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required to access detailed health checks",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Run all checks concurrently
  const [backendApi, actuatorHealth, webSocket] = await Promise.all([
    checkBackendRoot(),
    checkActuatorHealth(),
    checkWebSocket(),
  ]);

  const allServices = { backendApi, actuatorHealth, webSocket };

  const downCount = Object.values(allServices).filter(
    (s) => s.status === "down"
  ).length;

  const overallStatus =
    downCount === 0
      ? "ok"
      : downCount === Object.keys(allServices).length
        ? "down"
        : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: ADMIN_VERSION,
      services: allServices,
    },
    {
      status: overallStatus === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
