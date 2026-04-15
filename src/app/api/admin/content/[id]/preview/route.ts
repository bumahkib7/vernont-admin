import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

/**
 * Proxies the backend HTML preview render so the iframe can be same-origin
 * with the admin and the auth cookie is forwarded without CORS hassle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("admin_access_token")?.value;

    const response = await fetch(
      `${BACKEND_URL}/admin/content-preview/${encodeURIComponent(id)}/render`,
      {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      return new NextResponse(
        `<!doctype html><html><body style="font-family:sans-serif;padding:32px;color:#555;"><h2>Preview unavailable</h2><p>Backend returned ${response.status}.</p></body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    const html = await response.text();
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error fetching content preview:", error);
    return new NextResponse(
      `<!doctype html><html><body style="font-family:sans-serif;padding:32px;color:#555;"><h2>Preview unavailable</h2><p>${(error as Error).message}</p></body></html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
