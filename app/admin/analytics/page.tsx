"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  TreePine,
  UserCheck,
  LinkIcon,
  Download,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  userStats: {
    total: number;
    verified: number;
    onboarded: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  treeStats: {
    total: number;
    public: number;
    private: number;
    newThisMonth: number;
    avgMembersPerTree: number;
  };
  memberStats: {
    total: number;
    genderDistribution: Array<{ _id: string; count: number }>;
    ageDistribution: Array<{ range: string; count: number }>;
  };
  activityStats: {
    dailyActiveUsers: Array<{ date: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  };
  userLocations: Array<{ _id: string; count: number }>;
}

export default function AnalyticsPage(): JSX.Element {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>("30d");

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async (): Promise<void> => {
    setLoading(true);
    try {
      // Mock data for demo purposes
      const mockData: AnalyticsData = {
        userStats: {
          total: 1247,
          verified: 1089,
          onboarded: 892,
          active: 1156,
          newThisMonth: 47,
          growthRate: 12.5,
        },
        treeStats: {
          total: 324,
          public: 89,
          private: 235,
          newThisMonth: 12,
          avgMembersPerTree: 8.8,
        },
        memberStats: {
          total: 2847,
          genderDistribution: [
            { _id: "male", count: 1423 },
            { _id: "female", count: 1324 },
            { _id: "other", count: 100 },
          ],
          ageDistribution: [
            { range: "0-18", count: 234 },
            { range: "19-35", count: 567 },
            { range: "36-55", count: 892 },
            { range: "56-75", count: 734 },
            { range: "75+", count: 420 },
          ],
        },
        activityStats: {
          dailyActiveUsers: [
            { date: "2024-01-01", count: 234 },
            { date: "2024-01-02", count: 267 },
            { date: "2024-01-03", count: 189 },
            { date: "2024-01-04", count: 345 },
            { date: "2024-01-05", count: 298 },
          ],
          topActions: [
            { action: "VIEW_TREE", count: 1234 },
            { action: "ADD_MEMBER", count: 567 },
            { action: "EDIT_MEMBER", count: 345 },
            { action: "CREATE_RELATIONSHIP", count: 234 },
            { action: "SHARE_TREE", count: 123 },
          ],
        },
        userLocations: [
          { _id: "United States", count: 456 },
          { _id: "Canada", count: 234 },
          { _id: "United Kingdom", count: 189 },
          { _id: "Australia", count: 123 },
          { _id: "Germany", count: 98 },
        ],
      };

      await new Promise((resolve) => setTimeout(resolve, 500));
      setAnalytics(mockData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights and metrics</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div>Failed to load analytics data</div>;
  }

  const stats = [
    {
      name: "Total Users",
      value: formatNumber(analytics.userStats.total),
      change: `+${formatPercentage(analytics.userStats.growthRate)}`,
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Family Trees",
      value: formatNumber(analytics.treeStats.total),
      change: `+${analytics.treeStats.newThisMonth}`,
      changeType: "positive" as const,
      icon: TreePine,
    },
    {
      name: "Tree Members",
      value: formatNumber(analytics.memberStats.total),
      change: `Avg: ${analytics.treeStats.avgMembersPerTree}`,
      changeType: "neutral" as const,
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                        <span className="sr-only">Increased by</span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email Verified</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (analytics.userStats.verified /
                            analytics.userStats.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage(
                      (analytics.userStats.verified /
                        analytics.userStats.total) *
                        100
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Onboarding Complete
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (analytics.userStats.onboarded /
                            analytics.userStats.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage(
                      (analytics.userStats.onboarded /
                        analytics.userStats.total) *
                        100
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (analytics.userStats.active /
                            analytics.userStats.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPercentage(
                      (analytics.userStats.active / analytics.userStats.total) *
                        100
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Member Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.memberStats.genderDistribution.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600 capitalize">
                    {item._id || "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (item.count / analytics.memberStats.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top User Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top User Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.userLocations.slice(0, 5).map((location) => (
                <div
                  key={location._id}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600">{location._id}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (location.count / analytics.userStats.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatNumber(location.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Top User Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics.activityStats.topActions.map((action) => (
              <div key={action.action} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(action.count)}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {action.action.replace(/_/g, " ").toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
