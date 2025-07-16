import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FamilyTree from "@/models/FamilyTree";


export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const trees = await FamilyTree.find().select("_id name").sort({ name: 1 });

    return NextResponse.json({ trees });
  } catch (error) {
    console.error("Error fetching family trees:", error);
    return NextResponse.json(
      { error: "Failed to fetch family trees" },
      { status: 500 }
    );
  }
}
