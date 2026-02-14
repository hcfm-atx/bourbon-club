"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  _count: { members: number };
}

export default function AdminClubsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const isSuperAdmin = session?.user?.systemRole === "SUPER_ADMIN";

  const loadClubs = () => {
    fetch("/api/clubs").then((r) => r.json()).then(setClubs);
  };

  useEffect(() => { loadClubs(); }, []);

  if (!isSuperAdmin) {
    return <p>Access denied. Super Admin only.</p>;
  }

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null, isPublic }),
    });
    if (res.ok) {
      toast.success("Club created");
      setName("");
      setDescription("");
      setIsPublic(false);
      setShowForm(false);
      loadClubs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create club");
    }
    setSaving(false);
  };

  const deleteClub = async (id: string, clubName: string) => {
    const ok = await confirmDialog({
      title: "Delete Club",
      description: `Delete "${clubName}"? This will delete all data for this club.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/clubs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Club deleted");
      loadClubs();
    } else {
      toast.error("Failed to delete club");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Clubs</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Club"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={createClub} className="space-y-4">
              <div className="space-y-1">
                <Label>Club Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isPublic" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked === true)} />
                <Label htmlFor="isPublic">Public club (anyone can join)</Label>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Club"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <Card key={club.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div onClick={() => router.push(`/admin/clubs/${club.id}`)} className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{club.name}</CardTitle>
                  <Badge variant={club.isPublic ? "default" : "secondary"}>
                    {club.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {club._count.members} member{club._count.members !== 1 ? "s" : ""}
                </p>
                {club.description && (
                  <p className="text-sm text-muted-foreground mt-1">{club.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteClub(club.id, club.name)}
              >
                Delete
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      {clubs.length === 0 && (
        <p className="text-muted-foreground">No clubs yet. Create one to get started.</p>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
