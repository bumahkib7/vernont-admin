import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_access_token")?.value;
    const { searchParams } = new URL(request.url);

    // Backend route is /admin/seo/approval/content/status/{status} where
    // {status} is the path variable. The previous implementation hardcoded
    // APPROVED regardless of the requested status, so ?status=pending_review
    // silently returned APPROVED (usually empty). Map the query param onto
    // the path variable instead.
    const ALLOWED_STATUSES = new Set([
      "DRAFT",
      "PENDING_REVIEW",
      "APPROVED",
      "REJECTED",
    ]);
    const requestedStatus = (searchParams.get("status") || "PENDING_REVIEW").toUpperCase();
    const status = ALLOWED_STATUSES.has(requestedStatus) ? requestedStatus : "PENDING_REVIEW";

    const queryParams = new URLSearchParams();
    if (searchParams.get("page")) {
      queryParams.set("page", searchParams.get("page")!);
    }
    if (searchParams.get("size")) {
      queryParams.set("size", searchParams.get("size")!);
    }

    const response = await fetch(
      `${BACKEND_URL}/admin/seo/approval/content/status/${status}?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch content list" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching content list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
