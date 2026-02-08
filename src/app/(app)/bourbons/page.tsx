"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BOURBON_TYPES = ["BOURBON", "RYE", "WHEAT", "SINGLE_MALT", "BLEND", "OTHER"];

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
  type: string;
  proof: number | null;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export default function BourbonsPage() {
  const [bourbons, setBourbons] = useState<Bourbon[]>([]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "", distillery: "", proof: "", type: "BOURBON",
  });

  const loadBourbons = () => {
    fetch("/api/bourbons").then((r) => r.json()).then(setBourbons);
  };

  useEffect(() => { loadBourbons(); }, []);

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
        type: form.type,
        imageUrl,
      }),
    });
    if (res.ok) {
      toast.success("Bourbon added");
      setShowForm(false);
      setForm({ name: "", distillery: "", proof: "", type: "BOURBON" });
      setImageFile(null);
      loadBourbons();
    } else {
      toast.error("Failed to add bourbon");
    }
    setSaving(false);
  };

  const filtered = bourbons.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.distillery?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bourbons</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Bourbon"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Bourbon</CardTitle></CardHeader>
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
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Bourbon"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Search by name or distillery..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bourbon) => (
          <Card key={bourbon.id} className="hover:shadow-md transition-shadow h-full">
            {bourbon.imageUrl && (
              <div
                className="relative h-48 w-full cursor-zoom-in"
                onClick={() => setPreviewImage({ url: bourbon.imageUrl!, name: bourbon.name })}
              >
                <Image
                  src={bourbon.imageUrl}
                  alt={bourbon.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <Link href={`/bourbons/${bourbon.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{bourbon.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {bourbon.distillery || "Unknown distillery"}
                  {bourbon.proof && ` — ${bourbon.proof}°`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{bourbon.type.replace("_", " ")}</Badge>
                  {bourbon.avgRating !== null && (
                    <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount})</Badge>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground">No bourbons found.</p>}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full">
            <Image
              src={previewImage.url}
              alt={previewImage.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
