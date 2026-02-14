"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ChevronLeft, Star, Eye, Wind, UtensilsCrossed, Droplets, Timer } from "lucide-react";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ReviewReactions } from "@/components/review-reactions";
import { FlavorWheel } from "@/components/flavor-wheel";
import { WordCloud } from "@/components/word-cloud";

interface Review {
  id: string;
  rating: number;
  appearanceScore: number | null;
  appearanceNotes: string | null;
  noseScore: number | null;
  nose: string | null;
  tasteScore: number | null;
  palate: string | null;
  mouthfeelScore: number | null;
  mouthfeel: string | null;
  finishScore: number | null;
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
  price: number | null;
  type: string;
  region: string | null;
  age: number | null;
  imageUrl: string | null;
  createdById: string | null;
  avgRating: number | null;
  reviewCount: number;
  reviews: Review[];
  meetings: { meeting: { id: string; title: string; date: string } }[];
}

const CATEGORIES = [
  { key: "appearance", scoreKey: "appearanceScore", notesKey: "appearanceNotes", label: "Appearance", desc: "Color, clarity, legs", icon: Eye, placeholder: "e.g., Deep mahogany with ruby highlights", borderColor: "border-l-amber-300" },
  { key: "nose", scoreKey: "noseScore", notesKey: "nose", label: "Nose", desc: "Vanilla, caramel, fruit, wood, spice", icon: Wind, placeholder: "e.g., Caramel, vanilla, toasted oak", borderColor: "border-l-amber-400" },
  { key: "taste", scoreKey: "tasteScore", notesKey: "palate", label: "Taste", desc: "Sweetness, oak, spice, complexity", icon: UtensilsCrossed, placeholder: "e.g., Rich butterscotch, baking spices, dried fruit", borderColor: "border-l-amber-500" },
  { key: "mouthfeel", scoreKey: "mouthfeelScore", notesKey: "mouthfeel", label: "Mouthfeel", desc: "Thin, creamy, oily, hot", icon: Droplets, placeholder: "e.g., Smooth and creamy with a light warmth", borderColor: "border-l-amber-600" },
  { key: "finish", scoreKey: "finishScore", notesKey: "finish", label: "Finish", desc: "Length, dryness, smoothness", icon: Timer, placeholder: "e.g., Long and warm with lingering spice", borderColor: "border-l-amber-700" },
] as const;

export default function BourbonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [bourbon, setBourbon] = useState<Bourbon | null>(null);
  const [previewImage, setPreviewImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scores, setScores] = useState({ appearance: 5, nose: 5, taste: 5, mouthfeel: 5, finish: 5 });
  const [textNotes, setTextNotes] = useState({ appearance: "", nose: "", taste: "", mouthfeel: "", finish: "", general: "" });
  const [saving, setSaving] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ appearance: 5, nose: 5, taste: 5, mouthfeel: 5, finish: 5 });
  const [editNotes, setEditNotes] = useState({ appearance: "", nose: "", taste: "", mouthfeel: "", finish: "", general: "" });

  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  const deleteBourbon = async () => {
    const ok = await confirmDialog({ title: "Delete Bourbon", description: "Delete this bourbon? This cannot be undone.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    const res = await fetch(`/api/bourbons/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Bourbon deleted");
      router.push("/bourbons");
    } else {
      toast.error("Failed to delete bourbon");
    }
  };

  const loadBourbon = () => {
    fetch(`/api/bourbons/${id}`).then((r) => r.json()).then(setBourbon);
  };

  useEffect(() => { loadBourbon(); }, [id]);

  if (!bourbon) return (
    <div className="space-y-6">
      <Link href="/bourbons" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Bourbons
      </Link>
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-full md:w-64 h-64 rounded-lg shrink-0" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const myReview = bourbon.reviews.find((r) => r.user.id === session?.user?.id);
  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bourbonId: bourbon.id,
        appearanceScore: scores.appearance,
        appearanceNotes: textNotes.appearance || null,
        noseScore: scores.nose,
        nose: textNotes.nose || null,
        tasteScore: scores.taste,
        palate: textNotes.taste || null,
        mouthfeelScore: scores.mouthfeel,
        mouthfeel: textNotes.mouthfeel || null,
        finishScore: scores.finish,
        finish: textNotes.finish || null,
        notes: textNotes.general || null,
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

  const startEditing = (review: Review) => {
    setEditingReview(review.id);
    setEditScores({
      appearance: review.appearanceScore ?? 5,
      nose: review.noseScore ?? 5,
      taste: review.tasteScore ?? 5,
      mouthfeel: review.mouthfeelScore ?? 5,
      finish: review.finishScore ?? 5,
    });
    setEditNotes({
      appearance: review.appearanceNotes || "",
      nose: review.nose || "",
      taste: review.palate || "",
      mouthfeel: review.mouthfeel || "",
      finish: review.finish || "",
      general: review.notes || "",
    });
  };

  const saveEdit = async (reviewId: string) => {
    setSaving(true);
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appearanceScore: editScores.appearance,
        appearanceNotes: editNotes.appearance || null,
        noseScore: editScores.nose,
        nose: editNotes.nose || null,
        tasteScore: editScores.taste,
        palate: editNotes.taste || null,
        mouthfeelScore: editScores.mouthfeel,
        mouthfeel: editNotes.mouthfeel || null,
        finishScore: editScores.finish,
        finish: editNotes.finish || null,
        notes: editNotes.general || null,
      }),
    });
    if (res.ok) {
      toast.success("Review updated");
      setEditingReview(null);
      loadBourbon();
    } else {
      toast.error("Failed to update review");
    }
    setSaving(false);
  };

  const deleteReview = async (reviewId: string) => {
    const ok = await confirmDialog({ title: "Delete Review", description: "Delete this review?", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review deleted");
      loadBourbon();
    } else {
      toast.error("Failed to delete review");
    }
  };

  // Compute category averages across all reviews
  const categoryAvgs = CATEGORIES.map((cat) => {
    const key = cat.scoreKey as keyof Review;
    const vals = bourbon.reviews.map((r) => r[key]).filter((v) => v != null) as number[];
    return { label: cat.label, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <Link href="/bourbons" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back to Bourbons
        </Link>
        <Link href="/bourbons/compare">
          <Button variant="outline" size="sm">
            Compare Bourbons
          </Button>
        </Link>
      </div>

      {/* Hero Section with Image */}
      {bourbon.imageUrl ? (
        <>
          <div className="relative rounded-2xl overflow-hidden h-64 group">
            <Image
              src={bourbon.imageUrl}
              alt={bourbon.name}
              fill
              className="object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-105"
              priority
              sizes="100vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <div className="w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mb-3 rounded-full" />

              {bourbon.distillery && (
                <p className="text-amber-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold mb-2">
                  {bourbon.distillery}
                </p>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-2">
                {bourbon.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-white/90">
                {bourbon.proof && (
                  <span className="text-base md:text-lg font-light">{bourbon.proof}° Proof</span>
                )}
                {bourbon.avgRating !== null && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-base md:text-lg font-medium">{bourbon.avgRating.toFixed(1)}/10</span>
                    <span className="text-sm text-white/70">({bourbon.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              {(isAdmin || bourbon.createdById === session?.user?.id) && (
                <div className="flex items-center gap-2 mt-4">
                  <Link href={`/admin/bourbons/${bourbon.id}`}>
                    <Button variant="secondary" size="sm">Edit</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={deleteBourbon}>Delete</Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional details below hero */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Details</CardTitle>
              {(isAdmin || bourbon.createdById === session?.user?.id) && (
                <div className="flex items-center gap-2">
                  <Link href={`/admin/bourbons/${bourbon.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={deleteBourbon}>Delete</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{bourbon.type.replace("_", " ")}</Badge>
                {bourbon.avgRating !== null && (
                  <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount} reviews)</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {bourbon.distillery && <><span className="text-muted-foreground">Distillery</span><span>{bourbon.distillery}</span></>}
                {bourbon.proof && <><span className="text-muted-foreground">Proof</span><span>{bourbon.proof}°</span></>}
                {bourbon.age && <><span className="text-muted-foreground">Age</span><span>{bourbon.age} years</span></>}
                {bourbon.region && <><span className="text-muted-foreground">Region</span><span>{bourbon.region}</span></>}
                {bourbon.price && <><span className="text-muted-foreground">Price</span><span className="font-semibold">${bourbon.price.toFixed(2)}</span></>}
                {bourbon.cost && <><span className="text-muted-foreground">Cost</span><span>${bourbon.cost.toFixed(2)}</span></>}
                {bourbon.secondaryCost && <><span className="text-muted-foreground">Secondary</span><span>${bourbon.secondaryCost.toFixed(2)}</span></>}
              </div>
              {bourbon.price && bourbon.price > 0 && bourbon.avgRating !== null && bourbon.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">
                    Value Score: {((bourbon.avgRating / bourbon.price) * 10).toFixed(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">(rating per dollar)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{bourbon.name}</h1>
              {(isAdmin || bourbon.createdById === session?.user?.id) && (
                <div className="flex items-center gap-2">
                  <Link href={`/admin/bourbons/${bourbon.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={deleteBourbon}>Delete</Button>
                </div>
              )}
            </div>
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
              {bourbon.price && <><span className="text-muted-foreground">Price</span><span className="font-semibold">${bourbon.price.toFixed(2)}</span></>}
              {bourbon.cost && <><span className="text-muted-foreground">Cost</span><span>${bourbon.cost.toFixed(2)}</span></>}
              {bourbon.secondaryCost && <><span className="text-muted-foreground">Secondary</span><span>${bourbon.secondaryCost.toFixed(2)}</span></>}
            </div>
            {bourbon.price && bourbon.price > 0 && bourbon.avgRating !== null && bourbon.reviewCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-green-600 text-white">
                  Value Score: {((bourbon.avgRating / bourbon.price) * 10).toFixed(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">(rating per dollar)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Score Averages */}
      {bourbon.reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {categoryAvgs.map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="w-28 text-sm font-medium">{cat.label}</span>
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: cat.avg != null ? `${cat.avg * 10}%` : "0%" }}
                  />
                </div>
                <span className="w-10 text-sm text-right">{cat.avg != null ? cat.avg.toFixed(1) : "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {bourbon.reviews.length > 0 && bourbon.reviews.some(r => r.nose || r.palate || r.finish || r.notes || r.mouthfeel || r.appearanceNotes) && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Flavor Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <FlavorWheel reviews={bourbon.reviews} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tasting Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <WordCloud reviews={bourbon.reviews} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reviews ({bourbon.reviews.length})</CardTitle>
          {!myReview && !showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Write Review</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <form onSubmit={submitReview} className="space-y-4 border rounded-md p-4">
              <div className="text-center pb-4 border-b">
                <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                <p className="text-5xl font-bold text-foreground">{overallScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-1">/10</p>
              </div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className={`space-y-2 border-l-4 ${cat.borderColor} pl-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <Label>{cat.label}: {scores[cat.key as keyof typeof scores]}/10</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">{cat.desc}</span>
                    </div>
                    <Slider
                      min={0} max={10} step={1}
                      value={[scores[cat.key as keyof typeof scores]]}
                      onValueChange={([v]) => setScores((prev) => ({ ...prev, [cat.key]: v }))}
                    />
                    <Textarea
                      value={textNotes[cat.key as keyof typeof textNotes]}
                      onChange={(e) => setTextNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                      placeholder={cat.placeholder}
                      rows={2}
                    />
                  </div>
                );
              })}
              <div className="space-y-1">
                <Label>Additional Notes</Label>
                <Textarea
                  value={textNotes.general}
                  onChange={(e) => setTextNotes((prev) => ({ ...prev, general: e.target.value }))}
                  placeholder="Other thoughts..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Review"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
          {bourbon.reviews.map((review) => (
            <div key={review.id} className="border rounded-md p-3 space-y-2">
              {editingReview === review.id ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium">Editing review by {review.user.name || review.user.email}</p>
                  <div className="text-center pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                    <p className="text-5xl font-bold text-foreground">{(Object.values(editScores).reduce((a, b) => a + b, 0) / 5).toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">/10</p>
                  </div>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div key={cat.key} className={`space-y-2 border-l-4 ${cat.borderColor} pl-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <Label>{cat.label}: {editScores[cat.key as keyof typeof editScores]}/10</Label>
                          </div>
                        </div>
                        <Slider
                          min={0} max={10} step={1}
                          value={[editScores[cat.key as keyof typeof editScores]]}
                          onValueChange={([v]) => setEditScores((prev) => ({ ...prev, [cat.key]: v }))}
                        />
                        <Textarea
                          value={editNotes[cat.key as keyof typeof editNotes]}
                          onChange={(e) => setEditNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                          placeholder={cat.placeholder}
                          rows={2}
                        />
                      </div>
                    );
                  })}
                  <div className="space-y-1">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={editNotes.general}
                      onChange={(e) => setEditNotes((prev) => ({ ...prev, general: e.target.value }))}
                      placeholder="Other thoughts..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={() => saveEdit(review.id)}>{saving ? "Saving..." : "Save"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.user.name || review.user.email}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{review.rating.toFixed(1)}/10</Badge>
                      {(isAdmin || review.user.id === session?.user?.id) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => startEditing(review)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => deleteReview(review.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {CATEGORIES.some((cat) => review[cat.scoreKey as keyof Review] != null) ? (
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {CATEGORIES.map((cat) => {
                        const score = review[cat.scoreKey as keyof Review] as number | null;
                        return (
                          <div key={cat.key} className="text-center">
                            <p className="text-muted-foreground">{cat.label}</p>
                            <p className="font-medium">{score != null ? `${score}/10` : "—"}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Legacy review — no category scores{isAdmin && ". Click Edit to add them."}</p>
                  )}
                  {review.appearanceNotes && <p className="text-sm"><span className="text-muted-foreground">Appearance:</span> {review.appearanceNotes}</p>}
                  {review.nose && <p className="text-sm"><span className="text-muted-foreground">Nose:</span> {review.nose}</p>}
                  {review.palate && <p className="text-sm"><span className="text-muted-foreground">Taste:</span> {review.palate}</p>}
                  {review.mouthfeel && <p className="text-sm"><span className="text-muted-foreground">Mouthfeel:</span> {review.mouthfeel}</p>}
                  {review.finish && <p className="text-sm"><span className="text-muted-foreground">Finish:</span> {review.finish}</p>}
                  {review.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {review.notes}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                  <ReviewReactions reviewId={review.id} />
                </>
              )}
            </div>
          ))}
          {bourbon.reviews.length === 0 && !showForm && (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Be the first to review this bourbon and share your tasting notes with the club."
              actionLabel="Write a Review"
              onAction={() => setShowForm(true)}
            />
          )}
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
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
