import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("admin_access_token")?.value;
    const payload = await request.json().catch(() => ({}));
    const rejectedBy = typeof payload.rejectedBy === "string" && payload.rejectedBy
      ? payload.rejectedBy
      : "admin";
    const reason = typeof payload.reason === "string" ? payload.reason : "";

    const response = await fetch(
      `${BACKEND_URL}/admin/seo/approval/content/${encodeURIComponent(id)}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ rejectedBy, reason }),
      }
    );

    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Error rejecting content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
