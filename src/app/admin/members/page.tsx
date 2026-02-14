"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function Avatar({ name }: { name: string | null }) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];

  return (
    <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center text-white text-sm font-medium`}>
      {initial}
    </div>
  );
}

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
  const [invitePhone, setInvitePhone] = useState("");

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
    if (!inviteEmail && !invitePhone) {
      toast.error("Email or phone is required");
      return;
    }
    const res = await fetch(`/api/clubs/${clubId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail || undefined, phone: invitePhone || undefined, role: "MEMBER" }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(data.added ? "Member added" : data.smsSent ? "SMS invite sent" : "Invite sent");
      setInviteEmail("");
      setInvitePhone("");
      fetch("/api/members").then((r) => r.json()).then(setMembers);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to invite");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Members</h1>

      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={inviteMember} className="flex gap-3 flex-wrap">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="max-w-sm"
            />
            <Input
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="Phone number"
              className="max-w-[200px]"
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
                <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} />
                      <span>{member.name || "\u2014"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || "\u2014"}</TableCell>
                  <TableCell>{member.smsOptIn ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge className={member.role === "ADMIN" ? "bg-amber-600 text-white" : ""} variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toggleRole(member.id, member.role)}>
                      {member.role === "ADMIN" ? "Make Member" : "Make Admin"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeMember(member.id)}>
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
