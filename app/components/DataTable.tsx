"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

interface Profile {
  title?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
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
  profile?: Profile;
  address?: Address;
  role?: "user" | "moderator" | "admin" | "super_admin";
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DataTableProps {
  users: User[];
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function DataTable({ users, onView, onEdit, onDelete }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const columns = [
    {
      accessorKey: "displayName",
      header: "User",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback>
                {user.displayName
                  ? user.displayName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.displayName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: any) => {
        const role = row.original.role || "user";
        return <span className="capitalize">{role.replace("_", " ")}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => {
        const isActive = row.original.isActive;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "profile.title",
      header: "Title",
      cell: ({ row }: any) => row.original.profile?.title || "-",
    },
    {
      accessorKey: "profile.fullName",
      header: "Full Name",
      cell: ({ row }: any) => row.original.profile?.fullName || "-",
    },
    {
      accessorKey: "profile.gender",
      header: "Gender",
      cell: ({ row }: any) => row.original.profile?.gender || "-",
    },
    {
      accessorKey: "profile.dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }: any) => row.original.profile?.dateOfBirth || "-",
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }: any) => row.original.phoneNumber || "-",
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }: any) => {
        const address = row.original.address;
        if (!address) return "-";
        return `${address.street || ""}, ${address.city || ""}, ${
          address.state || ""
        }, ${address.country || ""}`;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (onView) onView(user);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onEdit) onEdit(user);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (onDelete) onDelete(user);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View all information about this user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedUser.displayName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedUser.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedUser.phoneNumber || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span>{" "}
                    {selectedUser.role || "user"}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Profile Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Title:</span>{" "}
                    {selectedUser.profile?.title || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Full Name:</span>{" "}
                    {selectedUser.profile?.fullName || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Gender:</span>{" "}
                    {selectedUser.profile?.gender || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Date of Birth:</span>{" "}
                    {selectedUser.profile?.dateOfBirth || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Blood Group:</span>{" "}
                    {selectedUser.profile?.bloodGroup || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Education:</span>{" "}
                    {selectedUser.profile?.education || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Occupation:</span>{" "}
                    {selectedUser.profile?.occupation || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Marital Status:</span>{" "}
                    {selectedUser.profile?.maritalStatus || "-"}
                  </p>
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <h3 className="font-semibold">Address Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Street:</span>{" "}
                    {selectedUser.address?.street || "-"}
                  </p>
                  <p>
                    <span className="font-medium">City:</span>{" "}
                    {selectedUser.address?.city || "-"}
                  </p>
                  <p>
                    <span className="font-medium">State:</span>{" "}
                    {selectedUser.address?.state || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Country:</span>{" "}
                    {selectedUser.address?.country || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Postal Code:</span>{" "}
                    {selectedUser.address?.postalCode || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* Placeholder for edit form */}
              <p className="text-center text-gray-500">
                Edit form will be implemented here
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser && onDelete) {
                  onDelete(selectedUser);
                }
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
