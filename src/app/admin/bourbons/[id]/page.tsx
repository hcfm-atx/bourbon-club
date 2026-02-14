"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BOURBON_TYPES = ["BOURBON", "RYE", "WHEAT", "SINGLE_MALT", "BLEND", "OTHER"];

interface Meeting {
  id: string;
  title: string;
  date: string;
}

export default function EditBourbonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "", distillery: "", proof: "", cost: "", secondaryCost: "", price: "",
    type: "BOURBON", region: "", age: "", imageUrl: "",
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [assignedMeetings, setAssignedMeetings] = useState<string[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState("");

  useEffect(() => {
    fetch(`/api/bourbons/${id}`).then((r) => r.json()).then((data) => {
      setForm({
        name: data.name || "",
        distillery: data.distillery || "",
        proof: data.proof?.toString() || "",
        cost: data.cost?.toString() || "",
        secondaryCost: data.secondaryCost?.toString() || "",
        price: data.price?.toString() || "",
        type: data.type || "BOURBON",
        region: data.region || "",
        age: data.age?.toString() || "",
        imageUrl: data.imageUrl || "",
      });
      setAssignedMeetings(data.meetings?.map((m: { meeting: Meeting }) => m.meeting.id) || []);
    });
    fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  }, [id]);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl: string | null = form.imageUrl || null;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        imageUrl = url;
      }
    }

    const res = await fetch(`/api/bourbons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        distillery: form.distillery || null,
        proof: form.proof ? parseFloat(form.proof) : null,
        cost: form.cost ? parseFloat(form.cost) : null,
        secondaryCost: form.secondaryCost ? parseFloat(form.secondaryCost) : null,
        price: form.price ? parseFloat(form.price) : null,
        type: form.type,
        region: form.region || null,
        age: form.age ? parseInt(form.age) : null,
        imageUrl,
      }),
    });
    if (res.ok) {
      toast.success("Bourbon updated");
      router.push("/admin/bourbons");
    } else {
      toast.error("Failed to update");
    }
    setSaving(false);
  };

  const assignToMeeting = async () => {
    if (!selectedMeeting) return;
    const res = await fetch(`/api/bourbons/${id}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: selectedMeeting }),
    });
    if (res.ok) {
      setAssignedMeetings((prev) => [...prev, selectedMeeting]);
      setSelectedMeeting("");
      toast.success("Assigned to meeting");
    } else {
      toast.error("Failed to assign");
    }
  };

  const unassignFromMeeting = async (meetingId: string) => {
    const res = await fetch(`/api/bourbons/${id}/meetings`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId }),
    });
    if (res.ok) {
      setAssignedMeetings((prev) => prev.filter((m) => m !== meetingId));
      toast.success("Removed from meeting");
    }
  };

  const availableMeetings = meetings.filter((m) => !assignedMeetings.includes(m.id));

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Edit Bourbon</h1>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Distillery</Label>
              <Input value={form.distillery} onChange={(e) => update("distillery", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proof</Label>
                <Input type="number" step="0.1" value={form.proof} onChange={(e) => update("proof", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input type="number" step="0.01" value={form.cost} onChange={(e) => update("cost", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Secondary ($)</Label>
                <Input type="number" step="0.01" value={form.secondaryCost} onChange={(e) => update("secondaryCost", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="Retail price for Value Score calculation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOURBON_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={form.region} onChange={(e) => update("region", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {form.imageUrl && !imageFile && (
                <div className="relative h-48 w-full">
                  <Image src={form.imageUrl} alt={form.name} fill className="object-cover rounded-lg" />
                </div>
              )}
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Meeting Assignments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {assignedMeetings.map((mid) => {
            const m = meetings.find((mt) => mt.id === mid);
            return m ? (
              <div key={mid} className="flex items-center justify-between border rounded-md p-2">
                <span className="text-sm">{m.title} — {new Date(m.date).toLocaleDateString()}</span>
                <Button variant="outline" size="sm" onClick={() => unassignFromMeeting(mid)}>Remove</Button>
              </div>
            ) : null;
          })}
          {availableMeetings.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select meeting..." /></SelectTrigger>
                <SelectContent>
                  {availableMeetings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} — {new Date(m.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={assignToMeeting} disabled={!selectedMeeting}>Assign</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
