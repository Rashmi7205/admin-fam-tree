import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDatabase } from "../mongodb";
import Admin from "@/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type Role = "admin" | "super_admin";

interface DecodedToken {
  _id: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AdminRequest extends NextRequest {
  admin?: DecodedToken;
}

// Token verification with DB check
export async function verifyAdminToken(
  token: string
): Promise<DecodedToken | null> {
  try {
    await connectToDatabase();

    const decoded = verify(token, JWT_SECRET) as DecodedToken;

    const admin = await Admin.findById(decoded._id);
    if (!admin || !admin.isActive) return null;

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Middleware to protect admin routes
export async function adminAuthMiddleware(
  request: AdminRequest
): Promise<NextResponse | null> {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    request.admin = admin;
    return null;
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

// Role guard
export function checkAdminRole(requiredRoles: Role[]) {
  return async (request: AdminRequest): Promise<NextResponse | null> => {
    const admin = request.admin;
    if (!admin) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!requiredRoles.includes(admin.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null;
  };
}