"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TreePine, User, Mail, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    trees: 0,
    members: 0,
    contacts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if not authenticated
    fetch("/api/admin/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    // Fetch dashboard stats and recent activity (placeholder logic)
    async function fetchStats() {
      setLoading(true);
      try {
        // Replace with real API endpoints
        const [usersRes, treesRes, membersRes, contactsRes] = await Promise.all(
          [
            fetch("/api/admin/users"),
            fetch("/api/admin/trees"),
            fetch("/api/admin/members"),
            fetch("/api/admin/contacted"),
          ]
        );
        const users = await usersRes.json();
        const trees = await treesRes.json();
        const members = await membersRes.json();
        const contacts = await contactsRes.json();
        setStats({
          users: users?.pagination?.total || users?.users?.length || 0,
          trees: trees?.pagination?.total || trees?.trees?.length || 0,
          members: members?.pagination?.total || members?.members?.length || 0,
          contacts: contacts?.contacts?.length || 0,
        });
        // For demo, just show recent users
        setRecent(users?.users?.slice(0, 5) || []);
      } catch {
        // fallback to zero
        setStats({ users: 0, trees: 0, members: 0, contacts: 0 });
        setRecent([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">
              Users
            </CardTitle>
            <Users className="h-8 w-8 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.users}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total registered users
            </div>
            <Link href="/admin/users">
              <Button
                variant="link"
                className="p-0 h-auto text-purple-600 mt-2"
              >
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">
              Family Trees
            </CardTitle>
            <TreePine className="h-8 w-8 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.trees}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total trees created
            </div>
            <Link href="/admin/trees">
              <Button variant="link" className="p-0 h-auto text-green-600 mt-2">
                View Trees
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">
              Members
            </CardTitle>
            <User className="h-8 w-8 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.members}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total family members
            </div>
            <Link href="/admin/members">
              <Button variant="link" className="p-0 h-auto text-blue-600 mt-2">
                View Members
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">
              Contacted Users
            </CardTitle>
            <Mail className="h-8 w-8 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.contacts}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Contact requests
            </div>
            <Link href="/admin/contacted">
              <Button variant="link" className="p-0 h-auto text-pink-600 mt-2">
                View Contacts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-purple-500" /> Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="text-muted-foreground">
                No recent users found.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((user: any) => (
                  <li
                    key={user._id}
                    className="py-2 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <span className="font-medium text-foreground">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
