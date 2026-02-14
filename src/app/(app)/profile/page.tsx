"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  myRole?: string;
}

interface JoinableClub {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  invited: boolean;
  _count: { members: number };
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [joinableClubs, setJoinableClubs] = useState<JoinableClub[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [newClubName, setNewClubName] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const loadClubs = () => {
    fetch("/api/clubs").then((r) => r.json()).then(setMyClubs);
    fetch("/api/onboarding/clubs").then((r) => r.json()).then(setJoinableClubs);
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || "");
        setPhone(data.phone || "");
        setSmsOptIn(data.smsOptIn || false);
        setHasPassword(data.hasPassword || false);
      });
    loadClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, smsOptIn }),
    });
    if (res.ok) {
      toast.success("Profile updated");
      update();
    } else {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      }),
    });
    if (res.ok) {
      toast.success(hasPassword ? "Password changed" : "Password set successfully");
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update password");
    }
    setSavingPassword(false);
  };

  const switchClub = async (clubId: string) => {
    setSwitching(clubId);
    await fetch("/api/clubs/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId }),
    });
    await update();
    setSwitching(null);
    window.location.reload();
  };

  const joinClub = async (clubId: string) => {
    setJoining(clubId);
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinClubIds: [clubId] }),
    });
    if (res.ok) {
      toast.success("Joined club!");
      await update();
      loadClubs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to join club");
    }
    setJoining(null);
  };

  const createClub = async () => {
    if (!newClubName.trim()) return;
    setCreatingClub(true);
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinClubIds: [], newClub: { name: newClubName.trim() } }),
    });
    if (res.ok) {
      toast.success("Club created!");
      setNewClubName("");
      await update();
      loadClubs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create club");
    }
    setCreatingClub(false);
  };

  const myClubIds = new Set(myClubs.map((c) => c.id));
  const availableClubs = joinableClubs.filter((c) => !myClubIds.has(c.id));

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={session?.user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
              />
              <Label htmlFor="smsOptIn">Receive SMS reminders for meetings</Label>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Clubs</CardTitle>
        </CardHeader>
        <CardContent>
          {myClubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">You&apos;re not a member of any clubs yet.</p>
          ) : (
            <div className="space-y-2">
              {myClubs.map((club) => {
                const isActive = club.id === session?.user?.currentClubId;
                return (
                  <div
                    key={club.id}
                    className={`flex items-center justify-between border rounded-md p-3 ${
                      isActive ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{club.name}</span>
                      {club.myRole && (
                        <Badge variant={club.myRole === "ADMIN" ? "default" : "secondary"}>
                          {club.myRole}
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                    {!isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={switching === club.id}
                        onClick={() => switchClub(club.id)}
                      >
                        {switching === club.id ? "Switching..." : "Switch"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {availableClubs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Join a Club</CardTitle>
            <CardDescription>Public clubs and clubs you&apos;ve been invited to.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{club.name}</span>
                      {club.invited && <Badge variant="secondary">Invited</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {club._count.members} {club._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={joining === club.id}
                    onClick={() => joinClub(club.id)}
                  >
                    {joining === club.id ? "Joining..." : "Join"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Create a Club</CardTitle>
          <CardDescription>Start a new club and invite your friends.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Club name"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
            />
            <Button
              disabled={!newClubName.trim() || creatingClub}
              onClick={createClub}
            >
              {creatingClub ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{hasPassword ? "Change Password" : "Set Password"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {hasPassword
              ? "Update your password for email + password sign-in."
              : "Set a password to enable email + password sign-in. You can always use a magic link instead."}
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
