"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Admin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "super_admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyAdmin = {
  _id: "",
  email: "",
  firstName: "",
  lastName: "",
  role: "admin" as const,
  isActive: true,
  createdAt: "",
  updatedAt: "",
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(emptyAdmin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    setAdmins(data.admins || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpen = (admin?: Admin) => {
    setError("");
    if (admin) {
      setEditMode(true);
      setForm(admin);
      setPassword("");
    } else {
      setEditMode(false);
      setForm(emptyAdmin);
      setPassword("");
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(emptyAdmin);
    setPassword("");
    setError("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !form.email ||
      !form.firstName ||
      !form.lastName ||
      !form.role ||
      (!editMode && !password)
    ) {
      setError("All fields are required");
      return;
    }
    try {
      if (editMode) {
        const res = await fetch("/api/admin/admins", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: form._id,
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
            ...(password ? { passwordHash: password } : {}),
          }),
        });
        if (!res.ok)
          throw new Error((await res.json()).error || "Failed to update admin");
      } else {
        const res = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            role: form.role,
            passwordHash: password,
          }),
        });
        if (!res.ok)
          throw new Error((await res.json()).error || "Failed to create admin");
      }
      fetchAdmins();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this admin?"))
      return;
    await fetch(`/api/admin/admins?adminId=${adminId}`, { method: "DELETE" });
    fetchAdmins();
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Admin Management</h2>
          <Button onClick={() => handleOpen()}>Add Admin</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  {admin.firstName} {admin.lastName}
                </TableCell>
                <TableCell>{admin.role}</TableCell>
                <TableCell>{admin.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpen(admin)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="ml-2"
                    onClick={() => handleDelete(admin._id)}
                    disabled={!admin.isActive}
                  >
                    Deactivate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading && <div className="mt-4">Loading...</div>}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Admin" : "Add Admin"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={editMode}
            />
            <div className="flex gap-2">
              <Input
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleChange}
              />
              <Input
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded px-2 py-2"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <Input
              name="password"
              type="password"
              placeholder={
                editMode ? "New Password (leave blank to keep)" : "Password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">{editMode ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
