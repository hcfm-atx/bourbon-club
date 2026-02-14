"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

interface Club {
  id: string;
  name: string;
}

interface Membership {
  id: string;
  role: "ADMIN" | "MEMBER";
  club: Club;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  systemRole: "USER" | "SUPER_ADMIN";
  memberships: Membership[];
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [addingClub, setAddingClub] = useState<{ userId: string; clubId: string; role: string } | null>(null);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const isSuperAdmin = session?.user?.systemRole === "SUPER_ADMIN";

  const loadData = () => {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
    fetch("/api/clubs").then((r) => r.json()).then(setClubs);
  };

  useEffect(() => { loadData(); }, []);

  if (!isSuperAdmin) return <p>Access denied. Super Admin only.</p>;

  const addToClub = async (userId: string, clubId: string, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/memberships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId, role }),
    });
    if (res.ok) {
      toast.success("Added to club");
      setAddingClub(null);
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed");
    }
  };

  const removeFromClub = async (userId: string, clubId: string, clubName: string) => {
    const ok = await confirmDialog({
      title: "Remove from Club",
      description: `Remove user from ${clubName}?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/users/${userId}/memberships`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId }),
    });
    if (res.ok) {
      toast.success("Removed from club");
      loadData();
    } else {
      toast.error("Failed to remove");
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    const ok = await confirmDialog({
      title: "Delete User",
      description: `Permanently delete ${email}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast.success("User deleted");
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete");
    }
  };

  const toggleClubRole = async (userId: string, clubId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    const res = await fetch(`/api/admin/users/${userId}/memberships`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId, role: newRole }),
    });
    if (res.ok) {
      toast.success(`Role changed to ${newRole}`);
      loadData();
    } else {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Clubs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const availableClubs = clubs.filter(
                  (c) => !user.memberships.some((m) => m.club.id === c.id)
                );
                const isAdding = addingClub?.userId === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "\u2014"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.systemRole === "SUPER_ADMIN" ? "default" : "secondary"}>
                        {user.systemRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.memberships.length === 0 && (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                        {user.memberships.map((m) => (
                          <div key={m.id} className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => toggleClubRole(user.id, m.club.id, m.role)}
                              title={`Click to toggle role (currently ${m.role})`}
                            >
                              {m.club.name}
                              <span className="ml-1 text-[10px] opacity-60">
                                {m.role === "ADMIN" ? "A" : "M"}
                              </span>
                            </Badge>
                            <button
                              onClick={() => removeFromClub(user.id, m.club.id, m.club.name)}
                              className="text-destructive hover:text-destructive/80 text-xs"
                              title="Remove from club"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAdding ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={addingClub.clubId}
                              onChange={(e) => setAddingClub({ ...addingClub, clubId: e.target.value })}
                              className="h-8 rounded border border-input bg-background px-2 text-xs"
                            >
                              <option value="">Select club</option>
                              {availableClubs.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <select
                              value={addingClub.role}
                              onChange={(e) => setAddingClub({ ...addingClub, role: e.target.value })}
                              className="h-8 rounded border border-input bg-background px-2 text-xs"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs"
                              disabled={!addingClub.clubId}
                              onClick={() => addToClub(user.id, addingClub.clubId, addingClub.role)}
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() => setAddingClub(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            {availableClubs.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setAddingClub({ userId: user.id, clubId: "", role: "MEMBER" })}
                              >
                                Add to Club
                              </Button>
                            )}
                            {user.id !== session?.user?.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() => deleteUser(user.id, user.email)}
                              >
                                Delete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
