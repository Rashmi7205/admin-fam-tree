import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Admin from "@/models/Admin";

// GET /api/admin/admins - List admins with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const query: any = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (isActive === "true" || isActive === "false")
      query.isActive = isActive === "true";

    const total = await Admin.countDocuments(query);
    const admins = await Admin.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      admins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

// POST /api/admin/admins - Create a new admin
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, passwordHash, firstName, lastName, role } = body;

    if (!email || !passwordHash || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      );
    }

    const admin = await Admin.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        admin: {
          _id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/admins - Update an existing admin
export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { adminId, ...updateData } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();
    // Prevent updating email to an existing admin's email
    if (updateData.email) {
      const existing = await Admin.findOne({
        email: updateData.email,
        _id: { $ne: adminId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Another admin with this email already exists" },
          { status: 400 }
        );
      }
    }

    const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
      select: "-passwordHash",
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/admins - Soft delete an admin (set isActive to false)
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive: false, updatedAt: new Date() },
      { new: true, select: "-passwordHash" }
    );

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 }
    );
  }
}
