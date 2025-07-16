import { verifyToken } from "@/lib/middleware/auth";
  import User from "@/models/User";
  import dbConnect from "@/lib/mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);

    await dbConnect();

    // Find user in database
    const user = await User.findOne({ uid: decodedToken.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has admin role
    if (!user.role || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}
