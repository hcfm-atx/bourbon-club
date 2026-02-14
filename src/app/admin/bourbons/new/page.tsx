"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BOURBON_TYPES = ["BOURBON", "RYE", "WHEAT", "SINGLE_MALT", "BLEND", "OTHER"];

export default function NewBourbonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    distillery: "",
    proof: "",
    cost: "",
    secondaryCost: "",
    price: "",
    type: "BOURBON",
    region: "",
    age: "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        imageUrl = url;
      }
    }

    const res = await fetch("/api/bourbons", {
      method: "POST",
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
      toast.success("Bourbon added");
      router.push("/admin/bourbons");
    } else {
      toast.error("Failed to add bourbon");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Add Bourbon</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bourbon Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Buffalo Trace" required />
            </div>
            <div className="space-y-2">
              <Label>Distillery</Label>
              <Input value={form.distillery} onChange={(e) => update("distillery", e.target.value)} placeholder="Buffalo Trace Distillery" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proof</Label>
                <Input type="number" step="0.1" value={form.proof} onChange={(e) => update("proof", e.target.value)} placeholder="90" />
              </div>
              <div className="space-y-2">
                <Label>Age (years)</Label>
                <Input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input type="number" step="0.01" value={form.cost} onChange={(e) => update("cost", e.target.value)} placeholder="29.99" />
              </div>
              <div className="space-y-2">
                <Label>Secondary Cost ($)</Label>
                <Input type="number" step="0.01" value={form.secondaryCost} onChange={(e) => update("secondaryCost", e.target.value)} placeholder="49.99" />
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
                <Input value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="Kentucky" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Bourbon"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
