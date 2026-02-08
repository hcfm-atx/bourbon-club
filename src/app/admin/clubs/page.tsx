"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { members: number };
}

export default function AdminClubsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
      body: JSON.stringify({ name, description: description || null }),
    });
    if (res.ok) {
      toast.success("Club created");
      setName("");
      setDescription("");
      setShowForm(false);
      loadClubs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create club");
    }
    setSaving(false);
  };

  const deleteClub = async (id: string, clubName: string) => {
    if (!confirm(`Delete "${clubName}"? This will delete all data for this club.`)) return;
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
                <CardTitle className="text-lg">{club.name}</CardTitle>
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
    </div>
  );
}
