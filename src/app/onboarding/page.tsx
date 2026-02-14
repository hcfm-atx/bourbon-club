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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1612] via-[#2e2720] to-[#1a1612] -z-10" />

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 opacity-5 -z-10"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}
      />

      <div className="w-full max-w-2xl space-y-8 relative">
        {/* Brand Header */}
        <div className="text-center space-y-6">
          <h1
            className="text-5xl md:text-6xl font-bold text-[#fbbf24] tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            HOOTCH CLUB
          </h1>
          <div>
            <p className="text-2xl md:text-3xl text-[#fef3c7] font-light tracking-wide mb-4" style={{ fontFamily: 'var(--font-display), serif' }}>
              Every bottle tells a story. Start yours.
            </p>
            <div className="w-16 h-px bg-[#fbbf24]/30 mx-auto my-6" />
            <p className="text-lg text-[#a8a29e] font-light">
              Track tastings. Compare ratings. Manage your club.
            </p>
          </div>
        </div>

        {clubs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-light tracking-tight text-[#f5f0e8]">Join a Club</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {clubs.map((club) => (
                <Card
                  key={club.id}
                  onClick={() => toggleClub(club.id)}
                  className={`cursor-pointer transition-all border-[#3d342b] bg-[#241f1a]/80 backdrop-blur-sm ${
                    selectedClubIds.has(club.id)
                      ? "ring-2 ring-[#d97706] bg-[#2e2720]"
                      : "hover:bg-[#2e2720]/80 hover:shadow-lg hover:transform hover:scale-[1.02]"
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

        <Card className="border-[#3d342b] bg-[#241f1a]/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-light tracking-tight text-[#f5f0e8]">
              {clubs.length > 0 ? "Or Create Your Own" : "Create a Club"}
            </CardTitle>
            <CardDescription className="text-[#a8a29e]">Start a new bourbon club and invite your friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Club name"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              className="h-12 bg-[#1a1612] border-[#3d342b] text-[#f5f0e8] placeholder:text-[#78716c] focus:border-[#d97706] focus:ring-[#d97706]"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleComplete}
          disabled={!canSubmit || saving}
          className="w-full h-12 tracking-widest uppercase text-xs font-semibold bg-[#d97706] hover:bg-[#b45309] text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          size="lg"
        >
          {saving ? "Setting up..." : "Get Started"}
        </Button>
      </div>
    </div>
  );
}
