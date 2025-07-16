"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Search } from "lucide-react";
import type { JSX } from "react";

interface Member {
  _id: string;
  name: string;
}

interface FamilyTree {
  _id: string;
  name: string;
}

interface Relationship {
  _id: string;
  member1Id: string;
  member2Id: string;
  member1Name: string;
  member2Name: string;
  familyTreeId: string;
  familyTreeName: string;
  relationshipType:
    | "parent"
    | "child"
    | "spouse"
    | "sibling"
    | "grandparent"
    | "grandchild"
    | "cousin";
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RelationshipsPage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    relationshipType: "all",
    treeId: "all",
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] =
    useState<Relationship | null>(null);
  const [formData, setFormData] = useState({
    member1Id: "",
    member2Id: "",
    familyTreeId: "",
    relationshipType: "",
  });
  const [editFormData, setEditFormData] = useState({
    _id: "",
    relationshipType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchRelationships();
  }, [search, filters, pagination.page]);

  useEffect(() => {
    if (mounted) {
      fetchOptions();
    }
  }, [mounted]);

  const fetchRelationships = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("Fetching relationships...");

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filters.relationshipType && {
          relationshipType: filters.relationshipType,
        }),
        ...(filters.treeId && { familyTreeId: filters.treeId }),
      });

      const url = `/api/admin/relationships?${queryParams}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch relationships");
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (!data.relationships) {
        console.error("No relationships in response:", data);
        throw new Error("Invalid response format");
      }

      setRelationships(data.relationships);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      console.log("Fetching options...");
      const response = await fetch("/api/admin/relationships/options");
      console.log("Options response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch options");
      }

      const data = await response.json();
      console.log("Received options:", data);

      if (!data.members || !data.familyTrees) {
        console.error("Invalid options response:", data);
        throw new Error("Invalid options response format");
      }

      setMembers(data.members);
      setFamilyTrees(data.familyTrees);
    } catch (error) {
      console.error("Error fetching options:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleSearch = (value: string): void => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create relationship");
      }

      setIsAddDialogOpen(false);
      setFormData({
        member1Id: "",
        member2Id: "",
        familyTreeId: "",
        relationshipType: "",
      });
      fetchRelationships();
    } catch (error) {
      console.error("Error creating relationship:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (relationship: Relationship): void => {
    setSelectedRelationship(relationship);
    setEditFormData({
      _id: relationship._id,
      relationshipType: relationship.relationshipType,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/relationships", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update relationship");
      }

      setIsEditDialogOpen(false);
      setSelectedRelationship(null);
      fetchRelationships();
    } catch (error) {
      console.error("Error updating relationship:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string): void => {
    setSelectedRelationship(relationships.find((r) => r._id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedRelationship) return;

    try {
      const response = await fetch(
        `/api/admin/relationships?id=${selectedRelationship._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete relationship");
      }

      setIsDeleteDialogOpen(false);
      setSelectedRelationship(null);
      fetchRelationships();
    } catch (error) {
      console.error("Error deleting relationship:", error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Relationships</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Relationship</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member1Id">First Member</Label>
                <Select
                  value={formData.member1Id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, member1Id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member2Id">Second Member</Label>
                <Select
                  value={formData.member2Id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, member2Id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationshipType">Relationship Type</Label>
                <Select
                  value={formData.relationshipType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      relationshipType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="grandchild">Grandchild</SelectItem>
                    <SelectItem value="cousin">Cousin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyTreeId">Family Tree</Label>
                <Select
                  value={formData.familyTreeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, familyTreeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family tree" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyTrees.map((tree) => (
                      <SelectItem key={tree._id} value={tree._id}>
                        {tree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.relationshipType}
          onValueChange={(value) =>
            handleFilterChange("relationshipType", value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.treeId}
          onValueChange={(value) => handleFilterChange("treeId", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tree" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trees</SelectItem>
            {familyTrees.map((tree) => (
              <SelectItem key={tree._id} value={tree._id}>
                {tree.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-4">Loading relationships...</div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-4">No relationships found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Member</TableHead>
                <TableHead>Second Member</TableHead>
                <TableHead>Relationship Type</TableHead>
                <TableHead>Family Tree</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships.map((relationship) => (
                <TableRow key={relationship._id}>
                  <TableCell>{relationship.member1Name}</TableCell>
                  <TableCell>{relationship.member2Name}</TableCell>
                  <TableCell className="capitalize">
                    {relationship.relationshipType}
                  </TableCell>
                  <TableCell>{relationship.familyTreeName}</TableCell>
                  <TableCell>
                    {new Date(relationship.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(relationship)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(relationship._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {relationships.length} of {pagination.total} relationships
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Relationship</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="relationshipType">Relationship Type</Label>
              <Select
                value={editFormData.relationshipType}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    relationshipType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Relationship</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this relationship?</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
