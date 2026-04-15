import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("admin_access_token")?.value;

    const response = await fetch(
      `${BACKEND_URL}/admin/seo/approval/content/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (response.status === 404) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
