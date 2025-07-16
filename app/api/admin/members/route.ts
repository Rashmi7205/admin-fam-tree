import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";
import Member from "@/models/Member";
import FamilyTree from "@/models/FamilyTree";
const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().min(1, "Gender is required"),
  birthDate: z.string().nullable().optional(),
  deathDate: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  familyTreeId: z.string().min(1, "Family tree is required"),
});
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const treeIdSearch = searchParams.get("treeIdSearch") || "";
    const userIdSearch = searchParams.get("userIdSearch") || "";
    const gender = searchParams.get("gender") || "";
    const familyTreeId = searchParams.get("familyTreeId") || "";
    const birthDate = searchParams.get("birthDate") || "";
    const deathDate = searchParams.get("deathDate") || "";
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const userEmailSearch = searchParams.get("userEmailSearch") || "";
    const createdAt = searchParams.get("createdAt") || "";
    const updatedAt = searchParams.get("updatedAt") || "";

    // Build the query
    const query: any = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }
    if (treeIdSearch) {
      query.familyTreeId = treeIdSearch;
    }
    if (userIdSearch) {
      query._id = userIdSearch;
    }
    if (gender) query.gender = gender;
    if (familyTreeId) query.familyTreeId = familyTreeId;
    if (birthDate) {
      const start = new Date(birthDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(birthDate);
      end.setHours(23, 59, 59, 999);
      query.birthDate = { $gte: start, $lte: end };
    }
    if (deathDate) {
      const start = new Date(deathDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(deathDate);
      end.setHours(23, 59, 59, 999);
      query.deathDate = { $gte: start, $lte: end };
    }
    if (userEmailSearch) {
      query.$or = [
        ...(query.$or || []),
        { email: { $regex: userEmailSearch, $options: "i" } },
      ];
    }
    // Add createdAt filter (single date or range)
    if (createdAt) {
      if (createdAt.includes(",")) {
        const [startStr, endStr] = createdAt.split(",");
        const start = new Date(startStr);
        const end = new Date(endStr);
        query.createdAt = { $gte: start, $lte: end };
      } else {
        const start = new Date(createdAt);
        start.setHours(0, 0, 0, 0);
        const end = new Date(createdAt);
        end.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    }
    // Add updatedAt filter (single date or range)
    if (updatedAt) {
      if (updatedAt.includes(",")) {
        const [startStr, endStr] = updatedAt.split(",");
        const start = new Date(startStr);
        const end = new Date(endStr);
        query.updatedAt = { $gte: start, $lte: end };
      } else {
        const start = new Date(updatedAt);
        start.setHours(0, 0, 0, 0);
        const end = new Date(updatedAt);
        end.setHours(23, 59, 59, 999);
        query.updatedAt = { $gte: start, $lte: end };
      }
    }

    // Get total count
    const total = await Member.countDocuments(query);

    // Build sort object
    const sort: any = {};
    if (sortField.includes(".")) {
      const [field, subfield] = sortField.split(".");
      sort[field] = { [subfield]: sortOrder === "asc" ? 1 : -1 };
    } else {
      sort[sortField] = sortOrder === "asc" ? 1 : -1;
    }

    // Fetch members with pagination and populate relationships
    const members = await Member.find(query)
      .populate({
        path: "familyTreeId",
        select: "_id name",
        model: "FamilyTree",
        options: { strictPopulate: false },
      })
      .populate({
        path: "parents",
        select: "_id firstName lastName",
        model: "Member",
        options: { strictPopulate: false },
      })
      .populate({
        path: "children",
        select: "_id firstName lastName",
        model: "Member",
        options: { strictPopulate: false },
      })
      .populate({
        path: "spouseId",
        select: "_id firstName lastName",
        model: "Member",
        options: { strictPopulate: false },
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform the data to match the expected structure
    const transformedMembers = members.map((member: any) => ({
      _id: member._id?.toString() || "",
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      gender: member.gender || "",
      birthDate: member.birthDate
        ? new Date(member.birthDate).toISOString()
        : undefined,
      deathDate: member.deathDate
        ? new Date(member.deathDate).toISOString()
        : undefined,
      bio: member.bio || undefined,
      profileImageUrl: member.profileImageUrl || undefined,
      treeId: member.familyTreeId
        ? {
            _id: member.familyTreeId._id?.toString() || "",
            name: member.familyTreeId.name || "Unknown Tree",
          }
        : { _id: "", name: "Unknown Tree" },
      parents: (member.parents || []).map((p: any) =>
        p
          ? { _id: p._id?.toString(), name: `${p.firstName} ${p.lastName}` }
          : null
      ),
      children: (member.children || []).map((c: any) =>
        c
          ? { _id: c._id?.toString(), name: `${c.firstName} ${c.lastName}` }
          : null
      ),
      spouse: member.spouseId
        ? {
            _id: member.spouseId._id?.toString(),
            name: `${member.spouseId.firstName} ${member.spouseId.lastName}`,
          }
        : null,
      createdAt: member.createdAt
        ? new Date(member.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: member.updatedAt
        ? new Date(member.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

    return NextResponse.json({
      members: transformedMembers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const birthDate = formData.get("birthDate") as string | null;
    const deathDate = formData.get("deathDate") as string | null;
    const gender = formData.get("gender") as string | null;
    const bio = formData.get("bio") as string | null;
    const familyTreeId = formData.get("familyTreeId") as string;
    const parents = formData.getAll("parents").filter(Boolean) as string[];
    const children = formData.getAll("children").filter(Boolean) as string[];
    const spouseId = formData.get("spouseId") as string | null;
    let profileImageUrl: string | undefined = undefined;
    const file = formData.get("profileImage") as File | null;
    if (file && typeof file !== "string" && file.size > 0) {
      // Upload to /api/upload via HTTP
      const uploadForm = new FormData();
      uploadForm.append("file", file, file.name);
      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/upload`,
        {
          method: "POST",
          body: uploadForm,
        }
      );
      if (!uploadRes.ok) {
        return NextResponse.json(
          { error: "Image upload failed" },
          { status: 500 }
        );
      }
      const uploadData = await uploadRes.json();
      profileImageUrl = uploadData.path;
    }
    const familyTree = await FamilyTree.findById(familyTreeId);
    if (!familyTree) {
      return NextResponse.json(
        { error: "Family tree not found" },
        { status: 404 }
      );
    }
    const member = await Member.create({
      firstName,
      lastName,
      gender,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      deathDate: deathDate ? new Date(deathDate) : undefined,
      bio: bio || undefined,
      profileImageUrl,
      familyTreeId,
      parents,
      children,
      spouseId: spouseId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Transform the response to match the frontend's expected structure
    const transformedMember = {
      _id: member._id.toString(),
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender,
      birthDate: member.birthDate ? member.birthDate.toISOString() : undefined,
      deathDate: member.deathDate ? member.deathDate.toISOString() : undefined,
      bio: member.bio || undefined,
      profileImageUrl: member.profileImageUrl || undefined,
      treeId: {
        _id: familyTree._id.toString(),
        name: familyTree.name,
      },
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
    return NextResponse.json(transformedMember, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const id = formData.get("_id") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const birthDate = formData.get("birthDate") as string | null;
    const deathDate = formData.get("deathDate") as string | null;
    const gender = formData.get("gender") as string | null;
    const bio = formData.get("bio") as string | null;
    const familyTreeId = formData.get("familyTreeId") as string;

    // Validate required fields
    if (!firstName || !lastName || !gender || !familyTreeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if family tree exists
    const familyTree = await FamilyTree.findById(familyTreeId);
    if (!familyTree) {
      return NextResponse.json(
        { error: "Family tree not found" },
        { status: 404 }
      );
    }

    // Handle image upload if present
    let profileImageUrl: string | undefined = undefined;
    const file = formData.get("profileImage") as File | null;
    if (file && typeof file !== "string" && file.size > 0) {
      // Upload to /api/upload via HTTP
      const uploadForm = new FormData();
      uploadForm.append("file", file, file.name);
      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/upload`,
        {
          method: "POST",
          body: uploadForm,
          // Let fetch set the correct multipart boundary
        }
      );
      if (!uploadRes.ok) {
        return NextResponse.json(
          { error: "Image upload failed" },
          { status: 500 }
        );
      }
      const uploadData = await uploadRes.json();
      profileImageUrl = uploadData.path;
    }

    // Build update object
    const updateObj: any = {
      firstName,
      lastName,
      gender,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      bio: bio || undefined,
      familyTreeId: familyTreeId,
      updatedAt: new Date(),
    };
    if (typeof profileImageUrl === "string") {
      updateObj.profileImageUrl = profileImageUrl;
    }

    // Update member
    const member = await Member.findByIdAndUpdate(id, updateObj, { new: true });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Transform the response to match the frontend's expected structure
    const transformedMember = {
      _id: member._id.toString(),
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender,
      birthDate: member.birthDate ? member.birthDate.toISOString() : undefined,
      bio: member.bio || undefined,
      treeId: {
        _id: familyTree._id.toString(),
        name: familyTree.name,
      },
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      profileImageUrl: member.profileImageUrl || undefined,
    };

    return NextResponse.json(transformedMember);
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
