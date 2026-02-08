"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then(setMembers);
  }, []);

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Members</h1>
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
                  <TableCell>{member.name || "—"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || "—"}</TableCell>
                  <TableCell>{member.smsOptIn ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => toggleRole(member.id, member.role)}>
                      {member.role === "ADMIN" ? "Make Member" : "Make Admin"}
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
