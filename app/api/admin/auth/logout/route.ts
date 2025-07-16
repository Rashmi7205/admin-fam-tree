import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/middleware/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const authError = await adminAuthMiddleware(request);
    if (authError) return authError;

    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    // Clear the admin token cookie
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
