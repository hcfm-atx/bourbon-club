"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  invited: boolean;
  _count: { members: number };
}

export default function OnboardingPage() {
  const { update } = useSession();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [newClubName, setNewClubName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/clubs").then((r) => r.json()).then(setClubs);
  }, []);

  const toggleClub = (id: string) => {
    setSelectedClubIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = selectedClubIds.size > 0 || newClubName.trim().length > 0;

  const handleComplete = async () => {
    if (!canSubmit) return;
    setSaving(true);

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joinClubIds: Array.from(selectedClubIds),
        newClub: newClubName.trim() ? { name: newClubName.trim() } : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    await update();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Bourbon Club" width={100} height={100} className="mx-auto" />
          <div>
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-none">
              Welcome to Bourbon Club
            </h1>
            <div className="w-16 h-px bg-primary/30 mx-auto my-6" />
            <p className="text-lg text-muted-foreground font-light">
              Track tastings. Compare ratings. Manage your club.
            </p>
          </div>
        </div>

        {clubs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-light tracking-tight">Join a Club</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {clubs.map((club) => (
                <Card
                  key={club.id}
                  onClick={() => toggleClub(club.id)}
                  className={`cursor-pointer transition-all ${
                    selectedClubIds.has(club.id)
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{club.name}</CardTitle>
                        {club.invited && <Badge variant="secondary">Invited</Badge>}
                      </div>
                      {selectedClubIds.has(club.id) && (
                        <span className="text-primary text-lg">&#10003;</span>
                      )}
                    </div>
                    <CardDescription>
                      {club._count.members} {club._count.members === 1 ? "member" : "members"}
                    </CardDescription>
                  </CardHeader>
                  {club.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{club.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light tracking-tight">
              {clubs.length > 0 ? "Or Create Your Own" : "Create a Club"}
            </CardTitle>
            <CardDescription>Start a new bourbon club and invite your friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Club name"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              className="h-12"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleComplete}
          disabled={!canSubmit || saving}
          className="w-full h-12 tracking-widest uppercase text-xs"
          size="lg"
        >
          {saving ? "Setting up..." : "Get Started"}
        </Button>
      </div>
    </div>
  );
}
