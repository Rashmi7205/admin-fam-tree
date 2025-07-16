"use client";

import { useEffect, useState, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  UserCheck,
  Download,
  ArrowUpDown,
  Check,
  MoreVertical,
  UserPlus,
  Eye,
  Pencil,
  Copy,
} from "lucide-react";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReactElement, ChangeEvent } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useClipboard } from "@/hooks/use-clipboard";
import { DateRange } from "react-day-picker";
import { AddMemberModal } from "./AddEditMemberModal";

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
  profileImageUrl?: string;
  treeId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  parents?: { _id: string; name: string }[];
  children?: { _id: string; name: string }[];
  spouse?: { _id: string; name: string };
}

interface MemberFilters {
  gender: string;
  treeId: string;
  hasDeathDate: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FamilyTree {
  _id: string;
  name: string;
  description?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  gender: string;
  bio: string;
  familyTreeId: string;
}

export default function MembersPage(): ReactElement {
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [isAddRelationshipSheetOpen, setIsAddRelationshipSheetOpen] =
    useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    deathDate: "",
    bio: "",
    familyTreeId: "",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    deathDate: "",
    gender: "",
    bio: "",
    familyTreeId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [treeSearch, setTreeSearch] = useState("");
  const [filteredTrees, setFilteredTrees] = useState<FamilyTree[]>([]);
  // Set default limit to 25
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [date, setDate] = useState<Date>();
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<MemberFilters>({
    gender: "all",
    treeId: "all",
    hasDeathDate: "all",
  });
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [spouseId, setSpouseId] = useState<string>("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Add state for search type
  const [searchType, setSearchType] = useState<
    "name" | "treeId" | "userId" | "email"
  >("name");
  // Add clipboard hook
  const { copy } = useClipboard();
  // State for copy animation
  const [copiedRow, setCopiedRow] = useState<string | null>(null);
  // State for createdAt date search
  const [createdAt, setCreatedAt] = useState<Date | undefined>();
  const [updatedAtRange, setUpdatedAtRange] = useState<DateRange | undefined>();
  // Add these state variables near the other useState hooks
  const [parentSearch, setParentSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");
  const [treeIdInput, setTreeIdInput] = useState("");
  const [treeIdError, setTreeIdError] = useState("");
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [treeMembers, setTreeMembers] = useState<Member[]>([]);
  const [treeMembersLoading, setTreeMembersLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchTrees = async () => {
      try {
        const response = await fetch("/api/admin/family-trees", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch trees");
        const data = await response.json();
        setTrees(data.trees || []);
      } catch (error) {
        console.error("Error fetching trees:", error);
      }
    };

    if (mounted) {
      fetchTrees();
    }
  }, [mounted]);

  useEffect(() => {
    if (treeSearch) {
      const filtered = trees.filter((tree) =>
        tree.name.toLowerCase().includes(treeSearch.toLowerCase())
      );
      setFilteredTrees(filtered);
    } else {
      setFilteredTrees(trees);
    }
  }, [treeSearch, trees]);

  useEffect(() => {
    async function fetchAllMembers() {
      const res = await fetch("/api/admin/members?page=1&limit=1000");
      const data = await res.json();
      setAllMembers(data.members || []);
    }
    if (mounted) fetchAllMembers();
  }, [mounted]);

  // Update fetchMembers useEffect to depend on pagination, searchTerm, filters, sortField, sortOrder
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    pagination.limit,
    searchTerm,
    filters,
    sortField,
    sortOrder,
    createdAt,
    updatedAtRange,
  ]);

  const fetchMembers = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField,
        sortOrder,
      });
      if (searchType === "name" && searchTerm) {
        params.append("search", searchTerm);
      } else if (searchType === "treeId" && searchTerm) {
        params.append("treeIdSearch", searchTerm);
      }
      if (createdAt) {
        const dateStr = format(createdAt, "yyyy-MM-dd");
        params.append("createdAt", dateStr);
      }
      params.append("gender", filters.gender !== "all" ? filters.gender : "");
      params.append(
        "familyTreeId",
        filters.treeId !== "all" ? filters.treeId : ""
      );
      if (date) params.append("birthDate", format(date, "yyyy-MM-dd"));
      const response = await fetch(`/api/admin/members?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await response.json();
      setMembers(data.members || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      setMembers([]);
      setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof MemberFilters,
    value: string
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString?: string): string => {
    if (!mounted || !dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (birthDate?: string, deathDate?: string): string => {
    if (!birthDate) return "N/A";
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    return `${age} years${deathDate ? " (deceased)" : ""}`;
  };

  const handlePageChange = (newPage: number): void => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Gender",
      "Birth Date",
      "Death Date",
      "Tree",
      "Parents",
      "Children",
      "Spouse",
      "Created At",
      "Updated At",
    ];
    const csvData = members.map((member) => [
      member._id,
      member.firstName,
      member.lastName,
      member.gender,
      member.birthDate ? new Date(member.birthDate).toLocaleDateString() : "",
      member.deathDate ? new Date(member.deathDate).toLocaleDateString() : "",
      member.treeId.name,
      member.parents
        ?.map((p) => p?.name)
        .filter(Boolean)
        .join("; ") || "",
      member.children
        ?.map((c) => c?.name)
        .filter(Boolean)
        .join("; ") || "",
      member.spouse?.name || "",
      member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "",
      member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : "",
    ]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `members_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseViewSheet = () => {
    setIsViewSheetOpen(false);
    setTimeout(() => {
      setSelectedMember(null);
    }, 200);
  };

  const handleCloseEditSheet = () => {
    setIsEditSheetOpen(false);
    setTimeout(() => {
      setSelectedMember(null);
      resetEditFormData();
    }, 200);
  };

  const handleCloseDeleteSheet = () => {
    setIsDeleteSheetOpen(false);
    setTimeout(() => {
      setSelectedMember(null);
      setIsDeleting(false);
    }, 200);
  };

  const handleCloseAddRelationshipSheet = () => {
    setIsAddRelationshipSheetOpen(false);
    setTimeout(() => {
      setSelectedMember(null);
    }, 200);
  };

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false);
    setTimeout(() => {
      resetFormData();
      setIsSubmitting(false);
      setProfileImage(null);
      setProfileImagePreview("");
    }, 200);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update handleProfileImageChange to only set preview and store file in state, no upload:
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image size should be less than 8MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileImageChangeAdd = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image size should be less than 8MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Validate required fields
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.gender ||
      !formData.familyTreeId
    ) {
      toast.error("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          data.append(key, value);
        }
      });
      parentIds.forEach((id) => data.append("parents", id));
      childIds.forEach((id) => data.append("children", id));
      if (spouseId) data.append("spouseId", spouseId);
      if (profileImage) data.append("profileImage", profileImage);
      const response = await fetch("/api/admin/members", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Failed to create member");
      }
      toast.success("Member created successfully");
      handleCloseAddSheet();
      fetchMembers();
    } catch (error) {
      console.error("Error creating member:", error);
      toast.error("Failed to create member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      birthDate: "",
      deathDate: "",
      gender: "",
      bio: "",
      familyTreeId: "",
    });
    setParentIds([]);
    setChildIds([]);
    setSpouseId("");
    setProfileImage(null);
    setProfileImagePreview("");
  };

  const resetEditFormData = () => {
    setEditFormData({
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      deathDate: "",
      bio: "",
      familyTreeId: "",
    });
    setParentIds([]);
    setChildIds([]);
    setSpouseId("");
    setProfileImage(null);
    setProfileImagePreview("");
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setIsViewSheetOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    // Format dates as YYYY-MM-DD for input type="date"
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    };
    setEditFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender,
      birthDate: formatDate(member.birthDate),
      deathDate: formatDate(member.deathDate),
      bio: member.bio || "",
      familyTreeId: member.treeId._id,
    });
    setParentIds(member.parents?.map((p) => p._id) || []);
    setChildIds(member.children?.map((c) => c._id) || []);
    setSpouseId(member.spouse?._id || "");
    setProfileImage(null); // Clear previous image
    setProfileImagePreview(
      process.env.NEXT_PUBLIC_APP_URL + (member.profileImageUrl || "")
    );
    setIsEditSheetOpen(true);
  };

  // Dependency check: returns true if member is referenced in any other member
  const hasDependencies = (memberId: string): boolean => {
    return allMembers.some(
      (m) =>
        (m.parents && m.parents.some((p) => p._id === memberId)) ||
        (m.children && m.children.some((c) => c._id === memberId)) ||
        (m.spouse && m.spouse._id === memberId)
    );
  };

  const handleDelete = (member: Member) => {
    // Check for dependencies before opening delete sheet
    if (hasDependencies(member._id)) {
      toast.error(
        "This member cannot be deleted because they are referenced in other relationships. Remove dependencies first."
      );
      return;
    }
    setSelectedMember(member);
    setIsDeleteSheetOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;
    // Double-check dependencies before deleting
    if (hasDependencies(selectedMember._id)) {
      toast.error(
        "This member cannot be deleted because they are referenced in other relationships. Remove dependencies first."
      );
      setIsDeleteSheetOpen(false);
      return;
    }
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/members/${selectedMember._id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete member");
      }
      toast.success("Member deleted successfully");
      handleCloseDeleteSheet();
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Failed to delete member");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddRelationship = (member: Member) => {
    setSelectedMember(member);
    setIsAddRelationshipSheetOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("_id", selectedMember._id);
      parentIds.forEach((id) => formData.append("parents", id));
      childIds.forEach((id) => formData.append("children", id));
      if (spouseId) formData.append("spouseId", spouseId);
      if (profileImage) formData.append("profileImage", profileImage);
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update member");
      }
      toast.success("Member updated successfully");
      handleCloseEditSheet();
      fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get siblings of a member
  const getSiblings = (memberId: string) => {
    const member = allMembers.find((m) => m._id === memberId);
    if (!member || !member.parents) return [];
    // Siblings: other children of the same parents
    const parentIds = member.parents.map((p) => p._id);
    return allMembers
      .filter(
        (m) =>
          m._id !== memberId &&
          m.parents &&
          m.parents.some((p) => parentIds.includes(p._id))
      )
      .map((m) => m._id);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Member Management
          </h1>
          <p className="text-gray-600">Manage family tree members</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Member Management
          </h1>
          <p className="text-gray-600">Manage family tree members</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <AddMemberModal
            isOpen={isAddSheetOpen}
            onClose={handleCloseAddSheet}
            onSubmit={async (data) => {
              setIsSubmitting(true);
              try {
                const response = await fetch("/api/admin/members", {
                  method: "POST",
                  body: data,
                });
                if (!response.ok) throw new Error("Failed to create member");
                toast.success("Member created successfully");
                handleCloseAddSheet();
                fetchMembers();
              } catch (error) {
                console.error("Error creating member:", error);
                toast.error("Failed to create member");
              } finally {
                setIsSubmitting(false);
              }
            }}
            allMembers={allMembers}
            trees={trees}
            loading={isSubmitting}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <form
              onSubmit={handleSearch}
              className="flex-1 flex gap-2 flex-wrap"
            >
              <Select
                value={searchType}
                onValueChange={(value) =>
                  setSearchType(value as "name" | "treeId")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="treeId">Tree ID</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={
                  searchType === "name"
                    ? "Search by name..."
                    : "Search by tree id..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {/* Created At Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !createdAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {createdAt ? format(createdAt, "PPP") : "Created At"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={createdAt}
                      onSelect={setCreatedAt}
                      initialFocus
                    />
                  </div>
                  {createdAt && (
                    <div className="p-3 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreatedAt(undefined)}
                        className="w-full"
                      >
                        Clear Created At
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tree Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Tree ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, idx) => (
                    <TableRow
                      key={member._id}
                      className={idx % 2 === 0 ? "bg-muted" : ""}
                    >
                      <TableCell>
                        {member.profileImageUrl ? (
                          <img
                            src={
                              process.env.NEXT_PUBLIC_APP_URL +
                              member.profileImageUrl
                            }
                            alt={member.firstName + " " + member.lastName}
                            className="h-8 w-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 border">
                            {member.firstName?.charAt(0)}
                            {member.lastName?.charAt(0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className="font-medium truncate max-w-[120px]"
                        title={`${member.firstName} ${member.lastName}`}
                      >
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[120px]"
                        title={member.treeId.name}
                      >
                        {member.treeId.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {member.gender || "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-1 rounded select-all">
                            {member.treeId._id}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={
                              copiedRow === member.treeId._id
                                ? "text-green-600 animate-pulse"
                                : ""
                            }
                            onClick={() => {
                              copy(member.treeId._id);
                              setCopiedRow(member.treeId._id);
                              setTimeout(() => setCopiedRow(null), 1200);
                            }}
                            title="Copy Tree ID"
                            tabIndex={0}
                            aria-label="Copy Tree ID"
                          >
                            {copiedRow === member.treeId._id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(member)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Sheet */}
      {isViewSheetOpen && (
        <Sheet open={isViewSheetOpen} onOpenChange={handleCloseViewSheet}>
          <SheetContent className="sm:max-w-[540px]">
            <SheetHeader>
              <SheetTitle>Member Details</SheetTitle>
              <SheetDescription>
                View detailed information about this family member
              </SheetDescription>
            </SheetHeader>
            {selectedMember && (
              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  {selectedMember.profileImageUrl ? (
                    <img
                      src={selectedMember.profileImageUrl}
                      alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                      className="h-24 w-24 rounded-full object-cover border-4 border-purple-400 shadow-md"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600 border-4 border-purple-200">
                      {selectedMember.firstName?.charAt(0)}
                      {selectedMember.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="text-xl font-semibold text-purple-700 dark:text-purple-300">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Gender</Label>
                  <div className="col-span-3 capitalize">
                    {selectedMember.gender}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Birth Date</Label>
                  <div className="col-span-3">
                    {selectedMember.birthDate
                      ? format(new Date(selectedMember.birthDate), "PPP")
                      : "Not specified"}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Death Date</Label>
                  <div className="col-span-3">
                    {selectedMember.deathDate
                      ? format(new Date(selectedMember.deathDate), "PPP")
                      : "Not specified"}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Bio</Label>
                  <div className="col-span-3 whitespace-pre-line">
                    {selectedMember.bio || (
                      <span className="text-gray-400">No bio</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Family Tree</Label>
                  <div className="col-span-3">
                    {selectedMember.treeId?.name || "Unknown"}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Parents</Label>
                  <div className="col-span-3">
                    {selectedMember.parents?.length ? (
                      selectedMember.parents
                        .map((p) => p?.name)
                        .filter(Boolean)
                        .join(", ")
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Children</Label>
                  <div className="col-span-3">
                    {selectedMember.children?.length ? (
                      selectedMember.children
                        .map((c) => c?.name)
                        .filter(Boolean)
                        .join(", ")
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Spouse</Label>
                  <div className="col-span-3">
                    {selectedMember.spouse?.name || (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Created At</Label>
                  <div className="col-span-3">
                    {selectedMember.createdAt
                      ? format(new Date(selectedMember.createdAt), "PPP p")
                      : "-"}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Updated At</Label>
                  <div className="col-span-3">
                    {selectedMember.updatedAt
                      ? format(new Date(selectedMember.updatedAt), "PPP p")
                      : "-"}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Edit Sheet */}
      {isEditSheetOpen && (
        <Sheet open={isEditSheetOpen} onOpenChange={handleCloseEditSheet}>
          <SheetContent
            side="right"
            className="max-w-lg w-full sm:max-w-xl p-0 flex flex-col h-full max-h-[90vh]"
          >
            <SheetHeader className="p-4 sm:p-6 pb-0">
              <SheetTitle>Edit Family Member</SheetTitle>
            </SheetHeader>
            {selectedMember && (
              <div className="bg-gray-50 border rounded-md p-4 mx-4 mt-2 mb-2 text-xs text-gray-700 space-y-1">
                <div>
                  <span className="font-semibold">Member ID:</span>{" "}
                  {selectedMember._id}
                </div>
                <div>
                  <span className="font-semibold">Created At:</span>{" "}
                  {selectedMember.createdAt
                    ? format(new Date(selectedMember.createdAt), "PPP p")
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold">Updated At:</span>{" "}
                  {selectedMember.updatedAt
                    ? format(new Date(selectedMember.updatedAt), "PPP p")
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold">Family Tree:</span>{" "}
                  {selectedMember.treeId?.name || "Unknown"}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">No Image</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="profileImage" className="sr-only">
                    Profile Image
                  </Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Enter first name"
                    disabled={isSubmitting}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Enter last name"
                    disabled={isSubmitting}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({ ...prev, gender: value }))
                    }
                    disabled={isSubmitting}
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
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={editFormData.birthDate}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="deathDate">Death Date</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={editFormData.deathDate}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        deathDate: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={editFormData.bio || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="A short biography of the family member."
                  disabled={isSubmitting}
                  className="w-full min-h-[80px]"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parents">Parents</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val && !parentIds.includes(val))
                        setParentIds((prev) => [...prev, val]);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allMembers
                        .filter(
                          (m) =>
                            m._id !== selectedMember?._id &&
                            m.treeId._id === editFormData.familyTreeId &&
                            !childIds.includes(m._id) // can't be both parent and child
                        )
                        .map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.firstName} {m.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parentIds.map((pId) => {
                      const parent = allMembers.find((m) => m._id === pId);
                      return parent ? (
                        <Badge
                          key={pId}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            !isSubmitting &&
                            setParentIds((prev) =>
                              prev.filter((id) => id !== pId)
                            )
                          }
                        >
                          {parent.firstName} {parent.lastName} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="children">Children</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val && !childIds.includes(val))
                        setChildIds((prev) => [...prev, val]);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select child..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allMembers
                        .filter((m) => {
                          if (m._id === selectedMember?._id) return false;
                          if (m.treeId._id !== editFormData.familyTreeId)
                            return false;
                          if (parentIds.includes(m._id)) return false; // can't be both parent and child
                          // Exclude siblings of parents
                          let isSiblingOfParent = false;
                          for (const pid of parentIds) {
                            if (getSiblings(pid).includes(m._id)) {
                              isSiblingOfParent = true;
                              break;
                            }
                          }
                          if (isSiblingOfParent) return false;
                          return true;
                        })
                        .map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.firstName} {m.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {childIds.map((cId) => {
                      const child = allMembers.find((m) => m._id === cId);
                      return child ? (
                        <Badge
                          key={cId}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            !isSubmitting &&
                            setChildIds((prev) =>
                              prev.filter((id) => id !== cId)
                            )
                          }
                        >
                          {child.firstName} {child.lastName} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="spouse">
                    {editFormData.gender === "male"
                      ? "Wife"
                      : editFormData.gender === "female"
                      ? "Husband"
                      : "Spouse"}
                  </Label>
                  <Select
                    value={spouseId === "" ? "none" : spouseId}
                    onValueChange={(val) =>
                      setSpouseId(val === "none" ? "" : val)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${
                          editFormData.gender === "male"
                            ? "wife"
                            : editFormData.gender === "female"
                            ? "husband"
                            : "spouse"
                        }...`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No{" "}
                        {editFormData.gender === "male"
                          ? "wife"
                          : editFormData.gender === "female"
                          ? "husband"
                          : "spouse"}
                      </SelectItem>
                      {allMembers
                        .filter((m) => {
                          if (!m._id || m._id === selectedMember?._id)
                            return false;
                          if (m.treeId._id !== editFormData.familyTreeId)
                            return false;
                          if (
                            editFormData.gender === "male" &&
                            m.gender !== "female"
                          )
                            return false;
                          if (
                            editFormData.gender === "female" &&
                            m.gender !== "male"
                          )
                            return false;
                          return true;
                        })
                        .map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.firstName} {m.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white sticky bottom-0 left-0 w-full flex flex-col gap-2 z-10">
              <Button
                type="submit"
                onClick={handleEditSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <SheetClose asChild>
                <Button
                  type="button"
                  onClick={handleCloseEditSheet}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Delete Confirmation Sheet */}
      {isDeleteSheetOpen && (
        <Sheet open={isDeleteSheetOpen} onOpenChange={handleCloseDeleteSheet}>
          <SheetContent className="sm:max-w-[540px]">
            <SheetHeader>
              <SheetTitle>Delete Member</SheetTitle>
              <SheetDescription>
                Are you sure you want to delete this member? This action cannot
                be undone.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {selectedMember && (
                <p className="text-sm text-muted-foreground">
                  You are about to delete {selectedMember.firstName}{" "}
                  {selectedMember.lastName}
                </p>
              )}
            </div>
            <SheetFooter>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Member"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Add Relationship Sheet */}
      {isAddRelationshipSheetOpen && (
        <Sheet
          open={isAddRelationshipSheetOpen}
          onOpenChange={handleCloseAddRelationshipSheet}
        >
          <SheetContent className="sm:max-w-[540px]">
            <SheetHeader>
              <SheetTitle>Add Relationship</SheetTitle>
              <SheetDescription>
                Add a new relationship for this family member
              </SheetDescription>
            </SheetHeader>
            {/* ... existing relationship form content ... */}
          </SheetContent>
        </Sheet>
      )}

      {/* Add Member Sheet (like Edit) */}
      <Sheet open={isAddSheetOpen} onOpenChange={handleCloseAddSheet}>
        <SheetContent
          side="right"
          className="max-w-lg w-full sm:max-w-xl p-0 flex flex-col h-full max-h-[90vh]"
        >
          <SheetHeader className="p-4 sm:p-6 pb-0">
            <SheetTitle>Add Family Member</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={handleAddMemberSubmit}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">No Image</span>
                )}
              </div>
              <div>
                <Label htmlFor="profileImage" className="sr-only">
                  Profile Image
                </Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChangeAdd}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  name="gender"
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                  className="w-full"
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
              </div>
              <div>
                <Label htmlFor="treeIdInput">Tree ID</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="treeIdInput"
                    placeholder="Enter Tree ID"
                    value={treeIdInput}
                    onChange={(e) => {
                      setTreeIdInput(e.target.value);
                      setTreeIdError("");
                      setSelectedTree(null);
                      setTreeMembers([]);
                    }}
                    className="w-full"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!treeIdInput || treeMembersLoading}
                    onClick={async () => {
                      setTreeIdError("");
                      setSelectedTree(null);
                      setTreeMembers([]);
                      setTreeMembersLoading(true);
                      // Fetch all trees and find the one with this ID
                      try {
                        const res = await fetch("/api/admin/family-trees");
                        const data = await res.json();
                        const found = data.trees.find(
                          (t: FamilyTree) => t._id === treeIdInput
                        );
                        if (!found) {
                          setTreeIdError("Tree not found");
                          setTreeMembersLoading(false);
                          return;
                        }
                        setSelectedTree(found);
                        setFormData((prev) => ({
                          ...prev,
                          familyTreeId: found._id,
                        }));
                        // Fetch members for this tree
                        const membersRes = await fetch(
                          `/api/admin/members?familyTreeId=${found._id}`
                        );
                        const membersData = await membersRes.json();
                        setTreeMembers(membersData.members || []);
                      } catch (err) {
                        setTreeIdError("Error fetching tree or members");
                      } finally {
                        setTreeMembersLoading(false);
                      }
                    }}
                  >
                    Lookup
                  </Button>
                </div>
                {treeIdError && (
                  <div className="text-red-500 text-xs mt-1">{treeIdError}</div>
                )}
                {selectedTree && (
                  <div className="text-green-600 text-xs mt-1">
                    Tree: {selectedTree.name}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="deathDate">Death Date</Label>
                <Input
                  id="deathDate"
                  name="deathDate"
                  type="date"
                  value={formData.deathDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="A short biography of the family member."
                className="w-full min-h-[80px]"
              />
            </div>
            {formData.familyTreeId && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parents">Parents</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val && !parentIds.includes(val))
                        setParentIds((prev) => [...prev, val]);
                    }}
                    className="w-full"
                    disabled={treeMembersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTree && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="parents">Parents</Label>
                            <Select
                              onValueChange={(val) => {
                                if (val && !parentIds.includes(val))
                                  setParentIds((prev) => [...prev, val]);
                              }}
                              className="w-full"
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select parent..." />
                              </SelectTrigger>
                              <SelectContent>
                                {treeMembers
                                  .filter((m) => !childIds.includes(m._id))
                                  .map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                      {m.firstName} {m.lastName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {parentIds.map((pId) => {
                                const parent = treeMembers.find(
                                  (m) => m._id === pId
                                );
                                return parent ? (
                                  <Badge
                                    key={pId}
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setParentIds((prev) =>
                                        prev.filter((id) => id !== pId)
                                      )
                                    }
                                  >
                                    {parent.firstName} {parent.lastName} ×
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="children">Children</Label>
                            <Select
                              onValueChange={(val) => {
                                if (val && !childIds.includes(val))
                                  setChildIds((prev) => [...prev, val]);
                              }}
                              className="w-full"
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select child..." />
                              </SelectTrigger>
                              <SelectContent>
                                {treeMembers
                                  .filter((m) => !parentIds.includes(m._id))
                                  .map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                      {m.firstName} {m.lastName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {childIds.map((cId) => {
                                const child = treeMembers.find(
                                  (m) => m._id === cId
                                );
                                return child ? (
                                  <Badge
                                    key={cId}
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setChildIds((prev) =>
                                        prev.filter((id) => id !== cId)
                                      )
                                    }
                                  >
                                    {child.firstName} {child.lastName} ×
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="spouse">
                              {formData.gender === "female"
                                ? "Husband"
                                : "Spouse"}
                            </Label>
                            <Select
                              value={spouseId === "" ? "none" : spouseId}
                              onValueChange={(val) =>
                                setSpouseId(val === "none" ? "" : val)
                              }
                              className="w-full"
                              disabled={treeMembersLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select spouse..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No spouse</SelectItem>
                                {treeMembers
                                  .filter((m) => {
                                    if (!m._id || m._id === "") return false;
                                    if (
                                      formData.gender === "female" &&
                                      m.gender !== "male"
                                    )
                                      return false;
                                    if (
                                      formData.gender === "male" &&
                                      m.gender !== "female"
                                    )
                                      return false;
                                    return true;
                                  })
                                  .map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                      {m.firstName} {m.lastName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="p-4 border-t bg-white sticky bottom-0 left-0 w-full flex flex-col gap-2 z-10">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Member"}
              </Button>
              <SheetClose asChild>
                <Button
                  type="button"
                  onClick={handleCloseAddSheet}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </SheetClose>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
