"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ClubMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: { id: string; name: string | null; email: string };
}

interface ClubInvite {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  members: ClubMember[];
  invites: ClubInvite[];
  _count: { bourbons: number; meetings: number };
}

export default function AdminClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [saving, setSaving] = useState(false);

  const loadClub = () => {
    fetch(`/api/clubs/${id}`).then((r) => r.json()).then((data) => {
      setClub(data);
      setName(data.name);
      setDescription(data.description || "");
    });
  };

  useEffect(() => { loadClub(); }, [id]);

  if (!club) return <p>Loading...</p>;

  const saveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/clubs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    });
    if (res.ok) {
      toast.success("Club updated");
      setEditing(false);
      loadClub();
    } else {
      toast.error("Failed to update club");
    }
    setSaving(false);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/clubs/${id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, phone: invitePhone || undefined, role: inviteRole }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.added) {
        toast.success("Member added directly");
      } else {
        toast.success("Invite created");
      }
      setInviteEmail("");
      setInvitePhone("");
      loadClub();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to invite");
    }
  };

  const removeMember = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${club.name}?`)) return;
    const res = await fetch(`/api/clubs/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast.success("Member removed");
      loadClub();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove");
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    const res = await fetch(`/api/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success(`Role updated to ${newRole}`);
      loadClub();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{club.name}</h1>
        <Button variant="outline" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {editing && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={saveClub} className="space-y-4">
              <div className="space-y-1">
                <Label>Club Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{club.members.length}</p>
            <p className="text-sm text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{club._count.bourbons}</p>
            <p className="text-sm text-muted-foreground">Bourbons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{club._count.meetings}</p>
            <p className="text-sm text-muted-foreground">Meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{club.invites.length}</p>
            <p className="text-sm text-muted-foreground">Pending Invites</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Phone (for SMS)</Label>
              <Input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+15551234567"
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button type="submit">Invite</Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {club.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">{member.user.name || member.user.email}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === "ADMIN" ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleRole(member.user.id, member.role)}
                  >
                    {member.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeMember(member.user.id, member.user.name || member.user.email)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {club.invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {club.invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between border rounded-md p-3">
                  <p className="text-sm">{invite.email}</p>
                  <Badge variant="secondary">{invite.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
