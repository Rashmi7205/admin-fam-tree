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
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
} from "lucide-react";

type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";
type ContentType = "tree" | "member" | "profile" | "comment";

interface ModerationItem {
  _id: string;
  contentType: ContentType;
  contentId: string;
  title: string;
  description?: string;
  reportedBy: {
    _id: string;
    displayName: string;
    email: string;
  };
  reportReason: string;
  status: ModerationStatus;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ModerationFilters {
  status: string;
  contentType: string;
  reportReason: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ModerationPage(): JSX.Element {
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<ModerationFilters>({
    status: "all",
    contentType: "all",
    reportReason: "all",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    fetchModerationItems();
  }, [search, filters, pagination.page]);

  const fetchModerationItems = async (): Promise<void> => {
    setLoading(true);
    try {
      // Mock data for demo
      const mockItems: ModerationItem[] = [
        {
          _id: "1",
          contentType: "tree",
          contentId: "tree1",
          title: "Inappropriate Family Tree Name",
          description: "The Smith Family - Contains offensive language",
          reportedBy: {
            _id: "user1",
            displayName: "John Doe",
            email: "john.doe@example.com",
          },
          reportReason: "inappropriate_content",
          status: "pending",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
        },
        {
          _id: "2",
          contentType: "member",
          contentId: "member1",
          title: "Fake Profile Information",
          description: "Member profile contains false historical information",
          reportedBy: {
            _id: "user2",
            displayName: "Jane Smith",
            email: "jane.smith@example.com",
          },
          reportReason: "misinformation",
          status: "flagged",
          moderatorNotes: "Requires further investigation",
          createdAt: "2024-01-14T09:15:00Z",
          updatedAt: "2024-01-14T14:30:00Z",
        },
        {
          _id: "3",
          contentType: "profile",
          contentId: "user3",
          title: "Spam Profile",
          description: "User profile contains promotional content",
          reportedBy: {
            _id: "user4",
            displayName: "Bob Johnson",
            email: "bob.johnson@example.com",
          },
          reportReason: "spam",
          status: "approved",
          moderatorNotes: "Content reviewed and deemed acceptable",
          createdAt: "2024-01-13T16:45:00Z",
          updatedAt: "2024-01-13T18:20:00Z",
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 500));
      setModerationItems(mockItems);
      setPagination({
        page: 1,
        limit: 10,
        total: mockItems.length,
        pages: 1,
      });
    } catch (error) {
      console.error("Failed to fetch moderation items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string): void => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof ModerationFilters,
    value: string
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusUpdate = async (
    itemId: string,
    newStatus: ModerationStatus
  ): Promise<void> => {
    try {
      // Update the item status
      setModerationItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? {
                ...item,
                status: newStatus,
                moderatorNotes: moderatorNotes,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setSelectedItem(null);
      setModeratorNotes("");
    } catch (error) {
      console.error("Failed to update moderation status:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!mounted) return "Loading...";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (
    status: ModerationStatus
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "outline";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "flagged":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: ModerationStatus): JSX.Element => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "flagged":
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatContentType = (type: ContentType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatReportReason = (reason: string): string => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Content Moderation
          </h1>
          <p className="text-gray-600">Review and moderate reported content</p>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-600">Review and moderate reported content</p>
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
                placeholder="Search reports..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.contentType}
              onValueChange={(value) =>
                handleFilterChange("contentType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tree">Family Tree</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.reportReason}
              onValueChange={(value) =>
                handleFilterChange("reportReason", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Report Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="inappropriate_content">
                  Inappropriate Content
                </SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="copyright">Copyright</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation Queue ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderationItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatContentType(item.contentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.reportedBy.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.reportedBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatReportReason(item.reportReason)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeColor(item.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(item.status)}
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleStatusUpdate(item._id, "approved")
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleStatusUpdate(item._id, "rejected")
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} items
                </div>
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
                  <span className="text-sm">
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

      {/* Moderation Detail Modal */}
      {selectedItem && (
        <Card className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Moderation Review
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Content Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <strong>Title:</strong> {selectedItem.title}
                  </div>
                  <div>
                    <strong>Type:</strong>{" "}
                    {formatContentType(selectedItem.contentType)}
                  </div>
                  {selectedItem.description && (
                    <div>
                      <strong>Description:</strong> {selectedItem.description}
                    </div>
                  )}
                  <div>
                    <strong>Report Reason:</strong>{" "}
                    {formatReportReason(selectedItem.reportReason)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Reporter Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <strong>Name:</strong> {selectedItem.reportedBy.displayName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedItem.reportedBy.email}
                  </div>
                  <div>
                    <strong>Reported:</strong>{" "}
                    {formatDate(selectedItem.createdAt)}
                  </div>
                </div>
              </div>

              {selectedItem.moderatorNotes && (
                <div>
                  <h3 className="font-medium mb-2">Previous Moderator Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedItem.moderatorNotes}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Moderator Notes</h3>
                <Textarea
                  placeholder="Add your moderation notes..."
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleStatusUpdate(selectedItem._id, "rejected")
                  }
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleStatusUpdate(selectedItem._id, "flagged")
                  }
                >
                  Flag for Review
                </Button>
                <Button
                  onClick={() =>
                    handleStatusUpdate(selectedItem._id, "approved")
                  }
                >
                  Approve
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
