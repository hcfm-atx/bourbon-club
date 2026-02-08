"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  nose: string | null;
  palate: string | null;
  finish: string | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  cost: number | null;
  secondaryCost: number | null;
  type: string;
  region: string | null;
  age: number | null;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  reviews: Review[];
  meetings: { meeting: { id: string; title: string; date: string } }[];
}

export default function BourbonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [bourbon, setBourbon] = useState<Bourbon | null>(null);
  const [previewImage, setPreviewImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [nose, setNose] = useState("");
  const [palate, setPalate] = useState("");
  const [finish, setFinish] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBourbon = () => {
    fetch(`/api/bourbons/${id}`).then((r) => r.json()).then(setBourbon);
  };

  useEffect(() => { loadBourbon(); }, [id]);

  if (!bourbon) return <p>Loading...</p>;

  const myReview = bourbon.reviews.find((r) => r.user.id === session?.user?.id);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bourbonId: bourbon.id,
        rating,
        nose: nose || null,
        palate: palate || null,
        finish: finish || null,
        notes: notes || null,
      }),
    });
    if (res.ok) {
      toast.success("Review submitted");
      setShowForm(false);
      loadBourbon();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to submit review");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {bourbon.imageUrl && (
          <div
            className="relative w-full md:w-64 h-64 shrink-0 cursor-zoom-in"
            onClick={() => setPreviewImage(true)}
          >
            <Image src={bourbon.imageUrl} alt={bourbon.name} fill className="object-cover rounded-lg" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{bourbon.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{bourbon.type.replace("_", " ")}</Badge>
            {bourbon.avgRating !== null && (
              <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount} reviews)</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 text-sm">
            {bourbon.distillery && <><span className="text-muted-foreground">Distillery</span><span>{bourbon.distillery}</span></>}
            {bourbon.proof && <><span className="text-muted-foreground">Proof</span><span>{bourbon.proof}°</span></>}
            {bourbon.age && <><span className="text-muted-foreground">Age</span><span>{bourbon.age} years</span></>}
            {bourbon.region && <><span className="text-muted-foreground">Region</span><span>{bourbon.region}</span></>}
            {bourbon.cost && <><span className="text-muted-foreground">Cost</span><span>${bourbon.cost.toFixed(2)}</span></>}
            {bourbon.secondaryCost && <><span className="text-muted-foreground">Secondary</span><span>${bourbon.secondaryCost.toFixed(2)}</span></>}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reviews ({bourbon.reviews.length})</CardTitle>
          {!myReview && !showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Write Review</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <form onSubmit={submitReview} className="space-y-3 border rounded-md p-4">
              <div className="space-y-2">
                <Label>Rating: {rating}/10</Label>
                <Slider min={1} max={10} step={1} value={[rating]} onValueChange={([v]) => setRating(v)} />
              </div>
              <div className="space-y-1">
                <Label>Nose</Label>
                <Textarea value={nose} onChange={(e) => setNose(e.target.value)} placeholder="Aroma notes..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Palate</Label>
                <Textarea value={palate} onChange={(e) => setPalate(e.target.value)} placeholder="Taste notes..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Finish</Label>
                <Textarea value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Finish notes..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Additional Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Other thoughts..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Review"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
          {bourbon.reviews.map((review) => (
            <div key={review.id} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{review.user.name || review.user.email}</span>
                <Badge variant="secondary">{review.rating}/10</Badge>
              </div>
              {review.nose && <p className="text-sm"><span className="text-muted-foreground">Nose:</span> {review.nose}</p>}
              {review.palate && <p className="text-sm"><span className="text-muted-foreground">Palate:</span> {review.palate}</p>}
              {review.finish && <p className="text-sm"><span className="text-muted-foreground">Finish:</span> {review.finish}</p>}
              {review.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {review.notes}</p>}
              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {bourbon.reviews.length === 0 && !showForm && <p className="text-muted-foreground">No reviews yet.</p>}
        </CardContent>
      </Card>
      {previewImage && bourbon.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full">
            <Image
              src={bourbon.imageUrl}
              alt={bourbon.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
