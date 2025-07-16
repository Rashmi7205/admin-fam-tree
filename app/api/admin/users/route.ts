import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import User from "@/models/User";

// Initialize firebase-admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// GET /api/admin/users - Get all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const provider = searchParams.get("provider");
    const emailVerified = searchParams.get("emailVerified");
    const onboardingComplete = searchParams.get("onboardingComplete");
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const query: any = {};
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (provider) query.provider = provider;
    if (emailVerified === "true" || emailVerified === "false")
      query.emailVerified = emailVerified === "true";
    if (onboardingComplete === "true" || onboardingComplete === "false")
      query.onboardingComplete = onboardingComplete === "true";
    if (role) query.role = role;
    if (isActive === "true" || isActive === "false")
      query.isActive = isActive === "true";

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, displayName, password, ...rest } = body;

    // Require email and password
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists in DB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user in Firebase
    let firebaseUser;
    try {
      firebaseUser = await getAuth().createUser({
        email,
        displayName,
        password, // Use provided password only
        emailVerified: false,
        disabled: false,
      });
    } catch (fbErr: any) {
      return NextResponse.json(
        { error: fbErr.message || "Failed to create user in Firebase" },
        { status: 500 }
      );
    }

    // Create new user in MongoDB
    const user = await User.create({
      ...body,
      provider: "email",
      uid: firebaseUser.uid,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update an existing user
export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find user in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from Firebase first
    try {
      if (user.uid) {
        await getAuth().deleteUser(user.uid);
      }
    } catch (fbErr) {
      console.error("Error deleting user from Firebase:", fbErr);
      return NextResponse.json(
        { error: "Failed to delete user from Firebase" },
        { status: 500 }
      );
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
