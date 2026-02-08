"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Member {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "ADMIN" | "MEMBER";
  smsOptIn: boolean;
}

export default function AdminMembersPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");

  const clubId = session?.user?.currentClubId;

  useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then(setMembers);
  }, []);

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member from the club?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Member removed");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove member");
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole as "ADMIN" | "MEMBER" } : m)));
      toast.success(`Role updated to ${newRole}`);
    } else {
      toast.error("Failed to update role");
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    const res = await fetch(`/api/clubs/${clubId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "MEMBER" }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.added ? "Member added" : "Invite sent");
      setInviteEmail("");
      // Reload members
      fetch("/api/members").then((r) => r.json()).then(setMembers);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to invite");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Members</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={inviteMember} className="flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="max-w-sm"
              required
            />
            <Button type="submit">Invite</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Club Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>SMS</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name || "\u2014"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || "\u2014"}</TableCell>
                  <TableCell>{member.smsOptIn ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toggleRole(member.id, member.role)}>
                      {member.role === "ADMIN" ? "Make Member" : "Make Admin"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => removeMember(member.id)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
