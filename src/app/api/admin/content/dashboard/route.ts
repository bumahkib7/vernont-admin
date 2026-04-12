import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_access_token")?.value;

    const response = await fetch(`${BACKEND_URL}/admin/content-dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch dashboard stats" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching content dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
