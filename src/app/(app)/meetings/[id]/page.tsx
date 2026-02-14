"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "appearance", scoreKey: "appearanceScore", notesKey: "appearanceNotes", label: "Appearance", desc: "Color, clarity, legs" },
  { key: "nose", scoreKey: "noseScore", notesKey: "nose", label: "Nose", desc: "Vanilla, caramel, fruit, wood, spice" },
  { key: "taste", scoreKey: "tasteScore", notesKey: "palate", label: "Taste", desc: "Sweetness, oak, spice, complexity" },
  { key: "mouthfeel", scoreKey: "mouthfeelScore", notesKey: "mouthfeel", label: "Mouthfeel", desc: "Thin, creamy, oily, hot" },
  { key: "finish", scoreKey: "finishScore", notesKey: "finish", label: "Finish", desc: "Length, dryness, smoothness" },
] as const;

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
  user: { id: string; name: string | null; email: string };
}

interface MeetingBourbon {
  id: string;
  bourbon: { id: string; name: string; distillery: string | null; proof: number | null };
  reviews: Review[];
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string | null;
  location: string | null;
  bourbons: MeetingBourbon[];
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  const loadMeeting = () => {
    fetch(`/api/meetings/${id}`).then((r) => r.json()).then(setMeeting);
  };

  useEffect(() => { loadMeeting(); }, [id]);

  if (!meeting) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{meeting.title}</h1>
        <p className="text-muted-foreground">
          {new Date(meeting.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {meeting.location && ` — ${meeting.location}`}
        </p>
        {meeting.description && <p className="mt-2">{meeting.description}</p>}
      </div>

      {meeting.bourbons.length === 0 && (
        <p className="text-muted-foreground">No bourbons assigned to this meeting yet.</p>
      )}

      {meeting.bourbons.map((mb) => (
        <BourbonReviewSection
          key={mb.id}
          meetingBourbon={mb}
          userId={session?.user?.id}
          onReviewSubmitted={loadMeeting}
        />
      ))}
    </div>
  );
}

function BourbonReviewSection({
  meetingBourbon,
  userId,
  onReviewSubmitted,
}: {
  meetingBourbon: MeetingBourbon;
  userId?: string;
  onReviewSubmitted: () => void;
}) {
  const myReview = meetingBourbon.reviews.find((r) => r.user.id === userId);
  const [showForm, setShowForm] = useState(false);
  const [scores, setScores] = useState({ appearance: 5, nose: 5, taste: 5, mouthfeel: 5, finish: 5 });
  const [textNotes, setTextNotes] = useState({ appearance: "", nose: "", taste: "", mouthfeel: "", finish: "", general: "" });
  const [saving, setSaving] = useState(false);

  const avgRating = meetingBourbon.reviews.length > 0
    ? (meetingBourbon.reviews.reduce((sum, r) => sum + r.rating, 0) / meetingBourbon.reviews.length).toFixed(1)
    : "—";

  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bourbonId: meetingBourbon.bourbon.id,
        meetingBourbonId: meetingBourbon.id,
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
      onReviewSubmitted();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to submit review");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <Link href={`/bourbons/${meetingBourbon.bourbon.id}`} className="hover:underline">
            <CardTitle className="text-lg">{meetingBourbon.bourbon.name}</CardTitle>
          </Link>
          <p className="text-sm text-muted-foreground">
            {meetingBourbon.bourbon.distillery}
            {meetingBourbon.bourbon.proof && ` — ${meetingBourbon.bourbon.proof}°`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{avgRating}</p>
          <p className="text-xs text-muted-foreground">{meetingBourbon.reviews.length} review{meetingBourbon.reviews.length !== 1 ? "s" : ""}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetingBourbon.reviews.map((review) => (
          <div key={review.id} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{review.user.name || review.user.email}</span>
              <Badge variant="secondary">{review.rating.toFixed(1)}/10</Badge>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {CATEGORIES.map((cat) => {
                const score = review[cat.scoreKey as keyof Review] as number | null;
                return score != null ? (
                  <div key={cat.key} className="text-center">
                    <p className="text-muted-foreground">{cat.label}</p>
                    <p className="font-medium">{score}/10</p>
                  </div>
                ) : null;
              })}
            </div>
            {review.appearanceNotes && <p className="text-sm"><span className="text-muted-foreground">Appearance:</span> {review.appearanceNotes}</p>}
            {review.nose && <p className="text-sm"><span className="text-muted-foreground">Nose:</span> {review.nose}</p>}
            {review.palate && <p className="text-sm"><span className="text-muted-foreground">Taste:</span> {review.palate}</p>}
            {review.mouthfeel && <p className="text-sm"><span className="text-muted-foreground">Mouthfeel:</span> {review.mouthfeel}</p>}
            {review.finish && <p className="text-sm"><span className="text-muted-foreground">Finish:</span> {review.finish}</p>}
            {review.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {review.notes}</p>}
          </div>
        ))}

        {!myReview && !showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)}>Write Review</Button>
        )}
        {showForm && (
          <form onSubmit={submitReview} className="space-y-4 border rounded-md p-4">
            <p className="text-sm text-muted-foreground">Overall: <span className="font-bold text-foreground">{overallScore.toFixed(1)}/10</span></p>
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{cat.label}: {scores[cat.key as keyof typeof scores]}/10</Label>
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
                  placeholder={`${cat.label} notes (optional)...`}
                  rows={1}
                />
              </div>
            ))}
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
      </CardContent>
    </Card>
  );
}
