"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import type { ColumnDef, Row } from "@tanstack/react-table";

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
}

export default function ContactedUsersPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchContacts();
  }, [search, page, pageSize]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/contacted?search=${encodeURIComponent(
          search
        )}&page=${page}&limit=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data.contacts);
      setTotal(data.total || data.contacts.length);
    } catch (error) {
      toast.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (contactId: string) => {
    try {
      const res = await fetch(`/api/admin/contacted`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, status: "read" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marked as read");
      fetchContacts();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleArchive = async (contactId: string) => {
    try {
      const res = await fetch(`/api/admin/contacted`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, status: "archived" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Archived");
      fetchContacts();
    } catch {
      toast.error("Failed to archive");
    }
  };

  const handleReply = (contact: Contact) => {
    setSelectedContact(contact);
    setReplyMessage("");
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedContact) return;
    try {
      const res = await fetch(`/api/admin/contacted/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact._id,
          message: replyMessage,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Reply sent");
      setIsReplyDialogOpen(false);
      fetchContacts();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  // Stats for the top card
  const pendingCount = useMemo(
    () => contacts.filter((c) => c.status === "pending").length,
    [contacts]
  );
  const resolvedCount = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.status === "read" ||
          c.status === "replied" ||
          c.status === "archived"
      ).length,
    [contacts]
  );

  // DataTable columns
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: Row<Contact> }) => (
        <span>
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "subject",
      header: "Subject",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<Contact> }) => (
        <Badge
          variant={
            row.original.status === "pending" ? "destructive" : "default"
          }
          className={
            row.original.status === "pending"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }
        >
          {row.original.status === "pending" ? "Pending" : "Resolved"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: Row<Contact> }) => (
        <span>{new Date(row.original.createdAt).toLocaleString()}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<Contact> }) => (
        <div className="flex gap-2">
          {row.original.status !== "read" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAsRead(row.original._id)}
            >
              Mark as Read
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReply(row.original)}
          >
            Reply
          </Button>
          {row.original.status !== "archived" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleArchive(row.original._id)}
            >
              Archive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex gap-4 items-center">
            <span>Contacted User Queries</span>
            <Badge className="bg-red-500 text-white">
              Pending: {pendingCount}
            </Badge>
            <Badge className="bg-green-500 text-white">
              Resolved: {resolvedCount}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      <DataTable
        columns={columns}
        data={contacts}
        searchKey="email"
        searchPlaceholder="Search by email..."
        pageSize={pageSize}
      />
      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Page {page} of {Math.ceil(total / pageSize)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === Math.ceil(total / pageSize)}
          onClick={() =>
            setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
          }
        >
          Next
        </Button>
      </div>
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reply to {selectedContact?.firstName} {selectedContact?.lastName}
            </DialogTitle>
            <DialogDescription>
              Send a reply to the contacted user.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply here..."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
