"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Building2,
  UserCog,
  Trash2,
  Eye,
  RefreshCw,
  Users,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { exportToCSV } from "@/lib/utils/export-data";
import { ColumnDef, Row } from "@tanstack/react-table";
import ActionSheet from "@/components/admin/ActionSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";
import UserDetailsSheet from "@/components/admin/UserDetailsSheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import debounce from "lodash/debounce";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface Profile {
  title?: string;
  fullName?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  bloodGroup?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface User {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: "google" | "facebook" | "email";
  uid: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  profileComplete: boolean;
  phoneNumber?: string;
  profile?: {
    title?: string;
    fullName?: string;
    gender?: "male" | "female" | "other";
    dateOfBirth?: string;
    bloodGroup?: string;
    education?: string;
    occupation?: string;
    maritalStatus?: "single" | "married" | "divorced" | "widowed";
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  role?: "user" | "moderator" | "admin" | "super_admin";
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Add form schemas
const addUserSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  role: z.enum(["user", "moderator", "admin", "super_admin"]).default("user"),
  isActive: z.boolean().default(true),
  profile: z
    .object({
      title: z.string().optional(),
      fullName: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      dateOfBirth: z.string().optional(),
      bloodGroup: z.string().optional(),
      education: z.string().optional(),
      occupation: z.string().optional(),
      maritalStatus: z
        .enum(["single", "married", "divorced", "widowed"])
        .optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

// In editUserSchema, add all editable fields from the User model
const editUserSchema = addUserSchema.omit({ password: true }).extend({
  userId: z.string(),
  onboardingComplete: z.boolean().default(false),
  profileComplete: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
  photoURL: z.string().optional(),
  phoneNumber: z.string().optional(),
  profile: z
    .object({
      title: z.string().optional(),
      fullName: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      dateOfBirth: z.string().optional(),
      bloodGroup: z.string().optional(),
      education: z.string().optional(),
      occupation: z.string().optional(),
      maritalStatus: z
        .enum(["single", "married", "divorced", "widowed"])
        .optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

type AddUserFormData = z.infer<typeof addUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

const getRoleBadgeColor = (
  role?: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case "super_admin":
      return "destructive";
    case "admin":
      return "secondary";
    case "moderator":
      return "default";
    default:
      return "outline";
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    provider: "all",
    emailVerified: "all",
    onboardingComplete: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userTrees, setUserTrees] = useState<any[]>([]);
  const [userMembers, setUserMembers] = useState<any[]>([]);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState(false);

  const addForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "user",
      isActive: true,
      profile: {},
      address: {},
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      userId: "",
      displayName: "",
      email: "",
      phoneNumber: "",
      role: "user",
      isActive: true,
      profile: {},
      address: {},
      onboardingComplete: false,
      profileComplete: false,
      emailVerified: false,
    },
  });

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, [search, filters, page, pageSize, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Convert query params to array of [key, value] pairs
      const queryParamsArr = [
        ["page", page.toString()],
        ["limit", pageSize.toString()],
        ...(search ? [["search", search]] : []),
        ...(filters.provider !== "all" ? [["provider", filters.provider]] : []),
        ...(filters.emailVerified !== "all"
          ? [["emailVerified", filters.emailVerified]]
          : []),
        ...(filters.onboardingComplete !== "all"
          ? [["onboardingComplete", filters.onboardingComplete]]
          : []),
        ...(roleFilter !== "all" ? [["role", roleFilter]] : []),
        ...(statusFilter !== "all"
          ? [["isActive", statusFilter === "active" ? "true" : "false"]]
          : []),
      ];
      const queryParams = new URLSearchParams(queryParamsArr);
      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || pageSize,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1); // Reset page to 1 on new search
  }, 400);

  const handleSearch = (value: string) => {
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset page to 1 on filter change
  };

  const handleAddUser = async (data: AddUserFormData) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          provider: "email",
          emailVerified: false,
          onboardingComplete: false,
          profileComplete: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add user");
      }

      toast.success("User added successfully");
      setIsAddDialogOpen(false);
      addForm.reset();
      fetchUsers();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to add user"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to add user"
      );
    }
  };

  const handleEditUser = async (data: EditUserFormData) => {
    try {
      const { userId, ...updateData } = data;
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...updateData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      editForm.reset();
      fetchUsers();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to update user"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;
    setDeleting(true);
    const toastId = toast.loading("Deleting user...");
    try {
      const response = await fetch(
        `/api/admin/users?userId=${selectedUser._id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
      toast.success("User deleted successfully", { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user",
        { id: toastId }
      );
      console.error("Error deleting user:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setIsViewingDetails(true);

    try {
      // Fetch user's trees
      const treesResponse = await fetch(`/api/admin/trees?userId=${user._id}`);
      const treesData = await treesResponse.json();
      setUserTrees(treesData.trees || []);

      // Fetch user's members
      const membersResponse = await fetch(
        `/api/admin/members?userId=${user._id}`
      );
      const membersData = await membersResponse.json();
      setUserMembers(membersData.members || []);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    setIsEditDialogOpen(true);
    editForm.reset({
      userId: user._id,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role || "user",
      isActive: user.isActive ?? true,
      photoURL: user.photoURL || "",
      profile: user.profile || {},
      address: user.address || {},
      onboardingComplete: user.onboardingComplete ?? false,
      profileComplete: user.profileComplete ?? false,
      emailVerified: user.emailVerified ?? false,
    });
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsAddDialogOpen(true);
    addForm.reset();
  };

  const handleSave = async () => {
    try {
      const formData = {
        displayName: (
          document.getElementById("displayName") as HTMLInputElement
        )?.value,
        email: (document.getElementById("email") as HTMLInputElement)?.value,
        phoneNumber: (
          document.getElementById("phoneNumber") as HTMLInputElement
        )?.value,
        photoURL: (document.getElementById("photoURL") as HTMLInputElement)
          ?.value,
        profile: {
          title: (document.getElementById("profile.title") as HTMLInputElement)
            ?.value,
          fullName: (
            document.getElementById("profile.fullName") as HTMLInputElement
          )?.value,
          gender: (
            document.getElementById("profile.gender") as HTMLSelectElement
          )?.value,
          dateOfBirth: (
            document.getElementById("profile.dateOfBirth") as HTMLInputElement
          )?.value,
          bloodGroup: (
            document.getElementById("profile.bloodGroup") as HTMLInputElement
          )?.value,
          education: (
            document.getElementById("profile.education") as HTMLInputElement
          )?.value,
          occupation: (
            document.getElementById("profile.occupation") as HTMLInputElement
          )?.value,
          maritalStatus: (
            document.getElementById(
              "profile.maritalStatus"
            ) as HTMLSelectElement
          )?.value,
        },
        address: {
          street: (
            document.getElementById("address.street") as HTMLInputElement
          )?.value,
          city: (document.getElementById("address.city") as HTMLInputElement)
            ?.value,
          state: (document.getElementById("address.state") as HTMLInputElement)
            ?.value,
          country: (
            document.getElementById("address.country") as HTMLInputElement
          )?.value,
          postalCode: (
            document.getElementById("address.postalCode") as HTMLInputElement
          )?.value,
        },
        role: (document.getElementById("role") as HTMLSelectElement)?.value,
        isActive:
          (document.getElementById("status") as HTMLSelectElement)?.value ===
          "active",
        emailVerified:
          (document.getElementById("emailVerified") as HTMLSelectElement)
            ?.value === "true",
        onboardingComplete:
          (document.getElementById("onboardingComplete") as HTMLSelectElement)
            ?.value === "true",
      };

      // Validate required fields
      if (!formData.displayName || !formData.email) {
        toast.error("Display name and email are required");
        return;
      }

      let response;
      if (isEditing && selectedUser?._id) {
        // Update existing user
        response = await fetch("/api/admin/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUser._id,
            ...formData,
          }),
        });
      } else {
        // Create new user
        response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            provider: "email",
            emailVerified: false,
            onboardingComplete: false,
            profileComplete: false,
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to ${isEditing ? "update" : "create"} user`
        );
      }

      toast.success(`User ${isEditing ? "updated" : "created"} successfully`);
      setActionSheetOpen(false);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save user"
      );
    }
  };

  const handleExport = () => {
    // Flatten user data for CSV export
    const flattenUser = (user: User) => ({
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      photoURL: user.photoURL || "",
      provider: user.provider,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Profile fields
      profile_title: user.profile?.title || "",
      profile_fullName: user.profile?.fullName || "",
      profile_gender: user.profile?.gender || "",
      profile_dateOfBirth: user.profile?.dateOfBirth || "",
      profile_bloodGroup: user.profile?.bloodGroup || "",
      profile_education: user.profile?.education || "",
      profile_occupation: user.profile?.occupation || "",
      profile_maritalStatus: user.profile?.maritalStatus || "",
      // Address fields
      address_street: user.address?.street || "",
      address_city: user.address?.city || "",
      address_state: user.address?.state || "",
      address_country: user.address?.country || "",
      address_postalCode: user.address?.postalCode || "",
      address_lat: user.address?.coordinates?.lat ?? "",
      address_lng: user.address?.coordinates?.lng ?? "",
    });
    const allUserData = users.map(flattenUser);
    // Dynamically generate columns from keys
    const exportColumns = Object.keys(allUserData[0] || {}).map((key) => ({
      key,
      label: key,
    }));
    exportToCSV(allUserData, "users", exportColumns);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "photoURL",
      header: "Image",
      cell: ({ row }: { row: Row<User> }) => {
        const photoURL = row.getValue("photoURL") as string;
        return (
          <div className="flex items-center">
            {photoURL ? (
              <img
                src={photoURL}
                alt="User"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">
                  {row.original.displayName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "displayName",
      header: ({ column }: { column: any }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Display Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "profile.fullName",
      header: "Full Name",
      cell: ({ row }: { row: Row<User> }) => {
        const fullName = row.original.profile?.fullName;
        return <span>{fullName || "-"}</span>;
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }: { row: Row<User> }) => {
        const address = row.original.address;
        if (!address) return "-";
        const addressParts = [
          address.street,
          address.city,
          address.state,
          address.country,
          address.postalCode,
        ].filter(Boolean);
        return <span>{addressParts.join(", ") || "-"}</span>;
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Mobile Number",
      cell: ({ row }: { row: Row<User> }) => {
        const phoneNumber = row.getValue("phoneNumber") as string;
        return <span>{phoneNumber || "-"}</span>;
      },
    },
    {
      accessorKey: "email",
      header: ({ column }: { column: any }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "emailVerified",
      header: "Verification",
      cell: ({ row }: { row: Row<User> }) => {
        const isVerified = row.getValue("emailVerified") as boolean;
        return (
          <Badge variant={isVerified ? "default" : "secondary"}>
            {isVerified ? "Verified" : "Unverified"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }: { column: any }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }: { row: Row<User> }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <span>
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<User> }) => {
        const user = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewUser(user)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor user accounts</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-purple-500" /> Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage admin and public users
          </p>
          <div className="mt-2 text-xs text-purple-500">
            Showing users joined from {pagination.page} to {pagination.limit}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-end md:items-center">
          <Button
            onClick={handleAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-md"
          >
            <Plus className="mr-2 h-5 w-5" /> Add User
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-2xl shadow-md bg-card">
        <CardHeader className="border-b bg-muted rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Filter className="h-5 w-5" /> Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Remove role filter */}
            {/* <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select> */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl shadow-md bg-card">
        <CardHeader className="border-b bg-muted rounded-t-2xl">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Users className="h-5 w-5 text-purple-500" /> Users (
              {pagination.total})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                className="rounded-2xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              {/* Export to CSV Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="rounded-2xl"
              >
                Export to CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="w-full">
            <DataTable columns={columns} data={users} pageSize={pageSize} />
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-2xl bg-white dark:bg-zinc-900 shadow-md max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-purple-600 dark:text-purple-400">
              Add New User
            </DialogTitle>
            <DialogDescription>Add a new user or admin.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit(handleAddUser)}
              className="space-y-4"
            >
              <FormField
                name="displayName"
                control={addForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={addForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <FormField
                  name="password"
                  control={addForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* Remove the role field from Add User Dialog */}
              {/* <FormField
                name="role"
                control={addForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                name="isActive"
                control={addForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? "active" : "inactive"}
                        onValueChange={(v) => field.onChange(v === "active")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="photoURL"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Photo URL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="phoneNumber"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone Number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Profile fields */}
                  <FormField
                    name="profile.title"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.fullName"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.gender"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.dateOfBirth"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            placeholder="Date of Birth"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.bloodGroup"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Blood Group" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.education"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Education" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.occupation"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Occupation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="profile.maritalStatus"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Address fields */}
                  <FormField
                    name="address.street"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="address.city"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="address.state"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="address.country"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="address.postalCode"
                    control={editForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Postal Code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl"
                >
                  {isEditing ? "Save Changes" : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent
          side={
            typeof window !== "undefined" && window.innerWidth < 768
              ? "bottom"
              : "right"
          }
          className="max-w-lg w-full p-0"
        >
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-purple-600 dark:text-purple-400">
              Edit User
            </SheetTitle>
            <SheetDescription>Update user details.</SheetDescription>
          </SheetHeader>
          <div
            className="overflow-y-auto p-6"
            style={{ maxHeight: "calc(100vh - 8rem)" }}
          >
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEditUser)}
                className="space-y-4"
              >
                <FormField
                  name="displayName"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="email"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Remove the password field from Edit User Sheet */}
                {/* <FormField
                  name="password"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                {/* Remove the role field from Edit User Sheet */}
                {/* <FormField
                  name="role"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <FormField
                  name="isActive"
                  control={editForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? "active" : "inactive"}
                          onValueChange={(v) => field.onChange(v === "active")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="photoURL"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Photo URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="phoneNumber"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone Number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Profile fields */}
                    <FormField
                      name="profile.title"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.fullName"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Full Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.gender"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.dateOfBirth"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              placeholder="Date of Birth"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.bloodGroup"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Group</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Blood Group" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.education"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Education" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.occupation"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Occupation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="profile.maritalStatus"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">
                                  Divorced
                                </SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Address fields */}
                    <FormField
                      name="address.street"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address.city"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address.state"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address.country"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address.postalCode"
                      control={editForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Postal Code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                {formError && (
                  <div className="text-red-500 text-sm">{formError}</div>
                )}
                <SheetFooter>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl"
                  >
                    Save Changes
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete User Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl bg-white dark:bg-zinc-900 shadow-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">{selectedUser?.displayName}</span> (
              {selectedUser?.email})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDetailsSheet
        open={isViewingDetails}
        onOpenChange={setIsViewingDetails}
        user={selectedUser}
        trees={userTrees}
        members={userMembers}
      />
    </div>
  );
}
