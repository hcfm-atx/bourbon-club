"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { Star, Wine } from "lucide-react";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

const BOURBON_TYPES = ["BOURBON", "RYE", "WHEAT", "SINGLE_MALT", "BLEND", "OTHER"];

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
  type: string;
  proof: number | null;
  price: number | null;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  purchased: boolean;
  createdById: string | null;
}

interface CatalogEntry {
  name: string;
  distillery: string | null;
  proof: number | null;
  type: string;
  age: number | null;
  region: string | null;
  cost: number | null;
}

export default function BourbonsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";
  const [bourbons, setBourbons] = useState<Bourbon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "", distillery: "", proof: "", price: "", type: "BOURBON",
  });
  const [suggestions, setSuggestions] = useState<CatalogEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const loadBourbons = () => {
    fetch("/api/bourbons")
      .then((r) => r.json())
      .then(setBourbons)
      .finally(() => setLoading(false));
  };

  const deleteBourbon = async (id: string) => {
    const ok = await confirmDialog({ title: "Delete Bourbon", description: "Delete this bourbon? This cannot be undone.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    const res = await fetch(`/api/bourbons/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Bourbon deleted");
      setBourbons((prev) => prev.filter((b) => b.id !== id));
    } else {
      toast.error("Failed to delete bourbon");
    }
  };

  const togglePurchased = async (bourbon: Bourbon) => {
    const res = await fetch(`/api/bourbons/${bourbon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: !bourbon.purchased }),
    });
    if (res.ok) {
      setBourbons((prev) => prev.map((b) => b.id === bourbon.id ? { ...b, purchased: !b.purchased } : b));
    } else {
      toast.error("Failed to update bourbon");
    }
  };

  useEffect(() => { loadBourbons(); }, []);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const searchCatalog = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    const res = await fetch(`/api/bourbon-catalog?q=${encodeURIComponent(q)}`);
    if (res.ok) setSuggestions(await res.json());
  };

  const selectSuggestion = (entry: CatalogEntry) => {
    setForm({
      name: entry.name,
      distillery: entry.distillery || "",
      proof: entry.proof ? String(entry.proof) : "",
      price: "",
      type: entry.type,
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

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
        price: form.price ? parseFloat(form.price) : null,
        type: form.type,
        imageUrl,
      }),
    });
    if (res.ok) {
      toast.success("Bourbon added");
      setShowForm(false);
      setForm({ name: "", distillery: "", proof: "", price: "", type: "BOURBON" });
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
        <Button onClick={() => setShowForm(true)}>Add Bourbon</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bourbon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 relative">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  update("name", e.target.value);
                  searchCatalog(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing to search..."
                required
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 max-h-64 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">{s.name}</span>
                          {s.distillery && <span className="text-muted-foreground ml-2">— {s.distillery}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 ml-2">
                          {s.proof && `${s.proof}°`}
                          {s.type && ` · ${s.type.replace("_", " ")}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
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
              <Label>Price (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="45.00" className="pl-7" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? "Adding..." : "Add Bourbon"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Input
        placeholder="Search by name or distillery..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 && search ? (
        <EmptyState
          icon={Wine}
          title="No bourbons found"
          description={`No bourbons match your search "${search}". Try a different search term.`}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wine}
          title="No bourbons in the collection"
          description="Start building your bourbon collection by adding your first bottle."
          actionLabel="Add Bourbon"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bourbon) => (
          <Card
            key={bourbon.id}
            className="hover:shadow-md transition-shadow h-full cursor-pointer"
            onClick={() => router.push(`/bourbons/${bourbon.id}`)}
          >
            {bourbon.imageUrl && (
              <div
                className="relative h-48 w-full cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); setPreviewImage({ url: bourbon.imageUrl!, name: bourbon.name }); }}
              >
                <Image
                  src={bourbon.imageUrl}
                  alt={bourbon.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
                {bourbon.avgRating !== null && (
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {bourbon.avgRating.toFixed(1)}
                  </div>
                )}
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{bourbon.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {bourbon.distillery || "Unknown distillery"}
                {bourbon.proof && ` — ${bourbon.proof}°`}
              </p>
              {bourbon.price && (
                <p className="text-sm font-medium mt-1">${bourbon.price.toFixed(2)}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{bourbon.type.replace("_", " ")}</Badge>
                {bourbon.avgRating !== null && (
                  <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount})</Badge>
                )}
                {bourbon.price && bourbon.price > 0 && bourbon.avgRating !== null && bourbon.reviewCount > 0 && (
                  <Badge className="bg-green-600">Value: {((bourbon.avgRating / bourbon.price) * 10).toFixed(1)}</Badge>
                )}
                {bourbon.purchased && <Badge className="bg-amber-600">Purchased</Badge>}
              </div>
            </CardContent>
            {isAdmin && (
              <div className="flex items-center gap-2 px-6 pb-4" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={() => togglePurchased(bourbon)}>
                  {bourbon.purchased ? "Unmark Purchased" : "Mark Purchased"}
                </Button>
                <Link href={`/admin/bourbons/${bourbon.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deleteBourbon(bourbon.id)}>
                  Delete
                </Button>
              </div>
            )}
            {!isAdmin && bourbon.createdById === session?.user?.id && (
              <div className="flex items-center gap-2 px-6 pb-4" onClick={(e) => e.stopPropagation()}>
                <Link href={`/admin/bourbons/${bourbon.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deleteBourbon(bourbon.id)}>
                  Delete
                </Button>
              </div>
            )}
          </Card>
          ))}
        </div>
      )}

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
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
