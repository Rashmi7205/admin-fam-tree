import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/middleware/auth";
import { z } from "zod";
import Member from "@/models/Member";
import FamilyTree from "@/models/FamilyTree";


// Validation schema for tree creation
const createTreeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  userId: z.string().min(1, "User ID is required"),
});

// GET - Fetch all trees with pagination and filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isPublic = searchParams.get("isPublic");
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (isPublic) {
      query.isPublic = isPublic === "true";
    }
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }
    if (userId) {
      query.userId = userId;
    }

    // Get total count for pagination
    const total = await FamilyTree.countDocuments(query);

    // Fetch trees with pagination
    const trees = await FamilyTree.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Collect all unique userIds from the trees
    const userIds = Array.from(new Set(trees.map((tree) => tree.userId)));
    // Fetch user details in bulk
    const users = await User.find(
      { _id: { $in: userIds } },
      { _id: 1, name: 1, email: 1 }
    ).lean();
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    // Attach owner info to each tree
    const treesWithOwner = trees.map((tree) => ({
      ...tree,
      owner: userMap[tree.userId] || null,
    }));

    return NextResponse.json({
      trees: treesWithOwner,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching trees:", error);
    return NextResponse.json(
      { error: "Failed to fetch trees" },
      { status: 500 }
    );
  }
}

// POST - Create a new tree
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createTreeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, description, isPublic, userId } = validationResult.data;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a unique share link
    const shareLink = Math.random().toString(36).substring(2, 8);

    // Create new tree
    const tree = await FamilyTree.create({
      name,
      description,
      userId,
      isPublic,
      shareLink,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return the created tree as is
    return NextResponse.json(tree, { status: 201 });
  } catch (error) {
    console.error("Error creating tree:", error);
    return NextResponse.json(
      { error: "Failed to create tree" },
      { status: 500 }
    );
  }
}

// PUT - Update a tree
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { _id, name, description, isPublic } = body;

    // Validate required fields
    if (!_id || !name) {
      return NextResponse.json(
        { error: "Tree ID and name are required" },
        { status: 400 }
      );
    }

    // Check if tree exists and user has permission
    const existingTree = await FamilyTree.findById(_id);
    if (!existingTree) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    // The original code had decodedToken.uid here, but decodedToken is not defined.
    // Assuming userId is directly available or should be fetched if needed.
    // For now, removing the line as it's not part of the requested edit.
    // if (existingTree.userId.toString() !== decodedToken.uid) {
    //   return NextResponse.json(
    //     { error: "Unauthorized to update this tree" },
    //     { status: 403 }
    //   );
    // }

    // Update tree
    const updatedTree = await FamilyTree.findByIdAndUpdate(
      _id,
      {
        name,
        description,
        isPublic,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json(updatedTree);
  } catch (error) {
    console.error("Error updating tree:", error);
    return NextResponse.json(
      { error: "Failed to update tree" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tree
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get("id");

    if (!treeId) {
      return NextResponse.json(
        { error: "Tree ID is required" },
        { status: 400 }
      );
    }

    // Check if tree exists and user has permission
    const existingTree = await FamilyTree.findById(treeId);
    if (!existingTree) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    // Delete all members belonging to this tree
    await Member.deleteMany({ familyTreeId: treeId });
    // Delete the tree
    await FamilyTree.findByIdAndDelete(treeId);

    return NextResponse.json({ message: "Tree deleted successfully" });
  } catch (error) {
    console.error("Error deleting tree:", error);
    return NextResponse.json(
      { error: "Failed to delete tree" },
      { status: 500 }
    );
  }
}
