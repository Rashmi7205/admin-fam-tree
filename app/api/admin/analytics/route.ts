import { connectToDatabase } from "@/lib/mongodb";
import FamilyTree from "@/models/FamilyTree";
import Member from "@/models/Member";
import User from "@/models/User";
import { NextResponse } from "next/server";

interface UserStats {
  total: number;
  verified: number;
  onboarded: number;
  active: number;
  newThisMonth: number;
}

interface TreeStats {
  total: number;
  public: number;
  private: number;
  newThisMonth: number;
}

interface MemberStats {
  total: number;
  genderDistribution: Array<{ _id: string; count: number }>;
}

interface RelationshipStats {
  total: number;
  types: Array<{ _id: string; count: number }>;
}

interface UserLocation {
  _id: string;
  count: number;
}

interface AnalyticsResponse {
  userStats: UserStats;
  treeStats: TreeStats;
  memberStats: MemberStats;
  userLocations: UserLocation[];
}

export async function GET(): Promise<
  NextResponse<AnalyticsResponse | { error: string }>
> {
  try {
    await connectToDatabase();

    // User stats
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    const onboardedUsers = await User.countDocuments({
      onboardingComplete: true,
    });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Tree stats
    const totalTrees = await FamilyTree.countDocuments();
    const publicTrees = await FamilyTree.countDocuments({ isPublic: true });
    const privateTrees = await FamilyTree.countDocuments({ isPublic: false });

    // Member stats
    const totalMembers = await Member.countDocuments();
    const genderDistribution = await Member.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newTreesThisMonth = await FamilyTree.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // User locations
    const userLocations = await User.aggregate([
      { $match: { "address.country": { $exists: true } } },
      { $group: { _id: "$address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      userStats: {
        total: totalUsers,
        verified: verifiedUsers,
        onboarded: onboardedUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
      },
      treeStats: {
        total: totalTrees,
        public: publicTrees,
        private: privateTrees,
        newThisMonth: newTreesThisMonth,
      },
      memberStats: {
        total: totalMembers,
        genderDistribution,
      },
      userLocations,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
