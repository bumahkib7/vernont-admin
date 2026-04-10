import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const { searchParams } = new URL(request.url);

    const queryParams = new URLSearchParams();
    if (searchParams.get("status")) {
      queryParams.set("status", searchParams.get("status")!);
    }
    if (searchParams.get("page")) {
      queryParams.set("page", searchParams.get("page")!);
    }
    if (searchParams.get("size")) {
      queryParams.set("size", searchParams.get("size")!);
    }

    const response = await fetch(
      `${BACKEND_URL}/admin/content/list?${queryParams.toString()}`,
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
