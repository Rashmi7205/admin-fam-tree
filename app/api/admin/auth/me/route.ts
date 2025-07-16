import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import Admin from "@/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const decoded = verify(token.value, JWT_SECRET) as {
      _id: string;
      email: string;
      role: string;
    };

    await connectToDatabase();
    const admin = await Admin.findById(decoded._id).select("-passwordHash");

    if (!admin || !admin.isActive) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or inactive admin" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new NextResponse(JSON.stringify(admin), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in /api/admin/auth/me:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
