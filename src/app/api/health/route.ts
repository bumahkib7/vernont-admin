import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ADMIN_VERSION = process.env.npm_package_version || "0.1.0";

interface BackendStatus {
  status: "up" | "down";
  responseTimeMs: number;
  message?: string;
  error?: string;
}

async function checkBackend(): Promise<BackendStatus> {
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

export async function GET() {
  const backend = await checkBackend();

  const overallStatus = backend.status === "up" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: ADMIN_VERSION,
      services: {
        backend: backend,
      },
    },
    {
      status: overallStatus === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
