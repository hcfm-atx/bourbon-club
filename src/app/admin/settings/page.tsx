"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [clubName, setClubName] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setClubName(data.clubName || "");
      setVenmoHandle(data.venmoHandle || "");
      setPaypalEmail(data.paypalEmail || "");
      setReminderDaysBefore(data.reminderDaysBefore || 7);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubName, venmoHandle, paypalEmail, reminderDaysBefore }),
    });
    if (res.ok) {
      toast.success("Settings saved");
    } else {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Club Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name</Label>
              <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venmoHandle">Venmo Handle</Label>
              <Input id="venmoHandle" value={venmoHandle} onChange={(e) => setVenmoHandle(e.target.value)} placeholder="@your-venmo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input id="paypalEmail" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderDays">Reminder Days Before Meeting</Label>
              <Input
                id="reminderDays"
                type="number"
                min={1}
                max={30}
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(parseInt(e.target.value) || 7)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
