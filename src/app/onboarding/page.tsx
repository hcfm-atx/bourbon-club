"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  description: string | null;
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
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Bourbon Club</CardTitle>
            <CardDescription>
              Join an existing club or create your own to get started.
            </CardDescription>
          </CardHeader>
        </Card>

        {clubs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Join a Club</h2>
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
                      <CardTitle className="text-base">{club.name}</CardTitle>
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
            <CardTitle className="text-base">
              {clubs.length > 0 ? "Or Create Your Own" : "Create a Club"}
            </CardTitle>
            <CardDescription>Start a new bourbon club and invite your friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Club name"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleComplete}
          disabled={!canSubmit || saving}
          className="w-full"
          size="lg"
        >
          {saving ? "Setting up..." : "Get Started"}
        </Button>
      </div>
    </div>
  );
}
