"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UserRound,
  TreePine,
  Users2,
  Mail,
  Moon,
  Sun,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useEffect } from "react";

const routes = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UserRound,
  },
  {
    label: "Family Trees",
    href: "/admin/trees",
    icon: TreePine,
  },
  {
    label: "Members",
    href: "/admin/members",
    icon: Users2,
  },
  {
    label: "Contacted Users",
    href: "/admin/contacted",
    icon: Mail,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Admin profile state
  const [profile, setProfile] = useState<null | {
    name: string;
    email: string;
    role: string;
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/auth/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setProfile({
          name:
            data.firstName && data.lastName
              ? `${data.firstName} ${data.lastName}`
              : data.firstName || "Admin",
          email: data.email,
          role: data.role,
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && profile === null) {
      router.replace("/login");
    }
  }, [loading, profile, router]);

  // Theme toggle button
  const ThemeToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex justify-start px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="ml-3">Theme</span>
    </Button>
  );

  // Logout button
  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const SidebarProfile = () => (
    <div className="flex flex-col items-center gap-2 py-6 border-b border-purple-200 dark:border-purple-900">
      {loading ? (
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
      ) : profile ? (
        <>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{profile.name?.charAt(0) || "A"}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="font-semibold text-purple-900 dark:text-purple-200">
              {profile.name}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {profile.email}
            </div>
            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              {profile.role}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Sign in
        </Button>
      )}
    </div>
  );

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      {/* Profile section */}
      <SidebarProfile />
      {/* Logo/Header (optional, can remove if not needed) */}
      {/* <div className="flex items-center h-16 px-6 font-bold text-xl text-purple-700 dark:text-purple-400">
        <span>FamilyTree</span>
      </div> */}
      <div className="flex-1 flex flex-col gap-1 mt-2">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium",
                isActive
                  ? "bg-purple-600 text-white shadow"
                  : "text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-900 dark:hover:text-white"
              )}
              onClick={() => setOpen(false)}
            >
              <route.icon className="h-5 w-5" />
              <span>{route.label}</span>
            </Link>
          );
        })}
        <ThemeToggle />
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-purple-700 dark:text-purple-400"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 bg-white dark:bg-gray-950 border-r-0"
          >
            <SheetTitle className="sr-only">Sidebar Navigation</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 z-40 bg-gradient-to-b from-purple-100 to-purple-200 dark:from-gray-950 dark:to-purple-950 border-r border-purple-200 dark:border-purple-900 shadow-lg">
        <SidebarContent />
      </aside>
      {/* Padding for main content */}
      <div className="lg:pl-64" />
    </>
  );
}

export default Sidebar;
