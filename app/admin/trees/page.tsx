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
  Eye,
  Edit,
  Trash2,
  Download,
  Share,
  Plus,
  Calendar,
  Copy,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useClipboard } from "@/hooks/use-clipboard";

interface FamilyTree {
  _id: string;
  name: string;
  description: string;
  userId: string;
  members: any[];
  isPublic: boolean;
  shareLink: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface TreeFormData {
  name: string;
  description: string;
  isPublic: boolean;
  userId: string;
}

export default function TreesPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [isPublicFilter, setIsPublicFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<TreeFormData>({
    name: "",
    description: "",
    isPublic: false,
    userId: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { copy } = useClipboard();
  const [copiedTreeId, setCopiedTreeId] = useState<string | null>(null);
  const [treeMembers, setTreeMembers] = useState<Record<string, any | null>>(
    {}
  );

  useEffect(() => {
    setMounted(true);
    fetchTrees();
    fetchUsers();
  }, [search, isPublicFilter, pagination.page, date]);

  useEffect(() => {
    if (userSearch) {
      const filtered = users.filter(
        (user) =>
          (user.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
          (user.name || "").toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  useEffect(() => {
    if (trees.length === 0) return;
    // Fetch the first member for each tree
    const fetchMembersForTrees = async () => {
      const results: Record<string, any | null> = {};
      await Promise.all(
        trees.map(async (tree) => {
          try {
            const res = await fetch(
              `/api/admin/members?treeIdSearch=${tree._id}&limit=1`
            );
            if (!res.ok) throw new Error("Failed to fetch members");
            const data = await res.json();
            results[tree._id] = data.members?.[0] || null;
          } catch {
            results[tree._id] = null;
          }
        })
      );
      setTreeMembers(results);
    };
    fetchMembersForTrees();
  }, [trees]);

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(isPublicFilter !== "all" && { isPublic: isPublicFilter }),
        ...(date && { date: date.toISOString() }),
      });

      const response = await fetch(`/api/admin/trees?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trees");
      }

      const data = await response.json();
      setTrees(data.trees);
      setPagination({
        ...pagination,
        total: data.pagination.total,
        pages: data.pagination.pages,
      });
    } catch (error) {
      console.error("Failed to fetch trees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTree = async () => {
    if (!formData.userId) {
      toast({
        title: "Error",
        description: "Please select a user for the tree",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/trees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create tree");
      }

      toast({
        title: "Success",
        description: "Tree created successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        isPublic: false,
        userId: "",
      });
      fetchTrees();
    } catch (error) {
      console.error("Failed to create tree:", error);
      toast({
        title: "Error",
        description: "Failed to create tree. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTree = async () => {
    if (!selectedTree) return;

    try {
      const response = await fetch("/api/admin/trees", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          _id: selectedTree._id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tree");
      }

      toast({
        title: "Success",
        description: "Tree updated successfully",
      });
      setIsDialogOpen(false);
      setSelectedTree(null);
      setFormData({
        name: "",
        description: "",
        isPublic: false,
        userId: "",
      });
      fetchTrees();
    } catch (error) {
      console.error("Failed to update tree:", error);
      toast({
        title: "Error",
        description: "Failed to update tree. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTree = async () => {
    if (!deletingTreeId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/trees?id=${deletingTreeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete tree");
      }
      toast({
        title: "Success",
        description: "Tree deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeletingTreeId(null);
      fetchTrees();
    } catch (error) {
      console.error("Failed to delete tree:", error);
      toast({
        title: "Error",
        description: "Failed to delete tree. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (tree: FamilyTree) => {
    setSelectedTree(tree);
    setFormData({
      name: tree.name,
      description: tree.description,
      isPublic: tree.isPublic,
      userId: tree.userId || "",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTree(null);
    setFormData({
      name: "",
      description: "",
      isPublic: false,
      userId: "",
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return "Loading...";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Family Tree Management
          </h1>
          <p className="text-gray-600">Manage and monitor family trees</p>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Family Tree Management
          </h1>
          <p className="text-gray-600">Manage and monitor family trees</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Tree
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={isPublicFilter} onValueChange={setIsPublicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trees</SelectItem>
                <SelectItem value="true">Public</SelectItem>
                <SelectItem value="false">Private</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
                {date && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDate(undefined)}
                    >
                      Clear Date Filter
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button onClick={fetchTrees} className="w-full">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Family Trees ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tree Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Tree ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trees.map((tree) => (
                      <TableRow key={tree._id}>
                        <TableCell>{tree.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={tree.isPublic ? "default" : "secondary"}
                          >
                            {tree.isPublic ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tree.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs  px-2 py-1 rounded select-all">
                              {tree._id}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className={
                                copiedTreeId === tree._id
                                  ? "text-green-600 animate-pulse"
                                  : ""
                              }
                              onClick={() => {
                                copy(tree._id);
                                setCopiedTreeId(tree._id);
                                setTimeout(() => setCopiedTreeId(null), 1200);
                              }}
                              title="Copy Tree ID"
                              tabIndex={0}
                              aria-label="Copy Tree ID"
                            >
                              {copiedTreeId === tree._id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Tree"
                              onClick={() =>
                                window.open(
                                  `${process.env.NEXT_PUBLIC_APP_URL}/trees/${tree._id}/public`,
                                  "_blank"
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Tree"
                              onClick={() => handleEdit(tree)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Tree"
                              onClick={() => {
                                setDeletingTreeId(tree._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTree ? "Edit Tree" : "Create New Tree"}
            </DialogTitle>
            <DialogDescription>
              {selectedTree
                ? "Make changes to your family tree here."
                : "Create a new family tree to get started."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter tree name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter tree description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">Select User</Label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="border rounded-md max-h-[200px] overflow-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className={cn(
                          "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                          formData.userId === user._id && "bg-accent"
                        )}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            userId: user._id,
                          }));
                          setUserSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.userId === user._id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          <span className="text-sm text-gray-500">
                            {user.name}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {formData.userId && (
                  <div className="text-sm text-muted-foreground">
                    Selected:{" "}
                    {users.find((user) => user._id === formData.userId)?.email}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isPublic">Public Tree</Label>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublic: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedTree ? handleUpdateTree : handleCreateTree}
              disabled={!formData.name || !formData.userId}
            >
              {selectedTree ? "Save Changes" : "Create Tree"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tree</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tree? This will also delete
              all its members and their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTree}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
