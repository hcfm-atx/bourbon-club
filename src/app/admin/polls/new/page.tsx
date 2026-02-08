"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewPollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const addDate = () => setDates([...dates, ""]);
  const removeDate = (i: number) => setDates(dates.filter((_, idx) => idx !== i));
  const updateDate = (i: number, val: string) => {
    const updated = [...dates];
    updated[i] = val;
    setDates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDates = dates.filter((d) => d);
    if (!title || validDates.length === 0) {
      toast.error("Title and at least one date required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dates: validDates }),
    });
    if (res.ok) {
      toast.success("Poll created");
      router.push("/admin/polls");
    } else {
      toast.error("Failed to create poll");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Poll</h1>
      <Card>
        <CardHeader>
          <CardTitle>Date Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="February Meeting" required />
            </div>
            <div className="space-y-2">
              <Label>Date Options</Label>
              {dates.map((date, i) => (
                <div key={i} className="flex gap-2">
                  <Input type="date" value={date} onChange={(e) => updateDate(i, e.target.value)} required />
                  {dates.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeDate(i)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addDate}>
                Add Date
              </Button>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
