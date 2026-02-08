"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface PurchasedBourbon {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  type: string;
}

export default function NewPollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pollType, setPollType] = useState<"DATE" | "BOURBON">("DATE");
  const [dates, setDates] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [purchasedBourbons, setPurchasedBourbons] = useState<PurchasedBourbon[]>([]);
  const [selectedBourbonIds, setSelectedBourbonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pollType === "BOURBON") {
      fetch("/api/bourbons?purchased=true")
        .then((r) => r.json())
        .then(setPurchasedBourbons);
    }
  }, [pollType]);

  const addDate = () => setDates([...dates, ""]);
  const removeDate = (i: number) => setDates(dates.filter((_, idx) => idx !== i));
  const updateDate = (i: number, val: string) => {
    const updated = [...dates];
    updated[i] = val;
    setDates(updated);
  };

  const toggleBourbon = (id: string) => {
    setSelectedBourbonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (pollType === "BOURBON") {
      if (selectedBourbonIds.size === 0) {
        toast.error("Select at least one bourbon");
        return;
      }
      setSaving(true);
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type: "BOURBON", bourbonIds: Array.from(selectedBourbonIds) }),
      });
      if (res.ok) {
        toast.success("Bourbon poll created");
        router.push("/admin/polls");
      } else {
        toast.error("Failed to create poll");
      }
      setSaving(false);
      return;
    }

    const validDates = dates.filter((d) => d);
    if (validDates.length === 0) {
      toast.error("At least one date required");
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
          <CardTitle>Poll Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={pollType === "DATE" ? "default" : "outline"}
              onClick={() => setPollType("DATE")}
              type="button"
            >
              Date Poll
            </Button>
            <Button
              variant={pollType === "BOURBON" ? "default" : "outline"}
              onClick={() => setPollType("BOURBON")}
              type="button"
            >
              Bourbon Preference
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{pollType === "BOURBON" ? "Bourbon Preference Poll" : "Date Poll"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={pollType === "BOURBON" ? "Which bourbons should we taste?" : "February Meeting"} required />
            </div>

            {pollType === "DATE" ? (
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
            ) : (
              <div className="space-y-2">
                <Label>Select Purchased Bourbons</Label>
                {purchasedBourbons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchased bourbons available. Mark bourbons as purchased first.</p>
                ) : (
                  <div className="space-y-2">
                    {purchasedBourbons.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 border rounded-md p-3">
                        <Checkbox
                          checked={selectedBourbonIds.has(b.id)}
                          onCheckedChange={() => toggleBourbon(b.id)}
                        />
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {b.distillery || "Unknown distillery"}
                            {b.proof && ` — ${b.proof}°`}
                            {` · ${b.type.replace("_", " ")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
