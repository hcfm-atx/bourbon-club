"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const [rating, setRating] = useState(myReview?.rating || 5);
  const [nose, setNose] = useState(myReview?.nose || "");
  const [palate, setPalate] = useState(myReview?.palate || "");
  const [finish, setFinish] = useState(myReview?.finish || "");
  const [notes, setNotes] = useState(myReview?.notes || "");
  const [saving, setSaving] = useState(false);

  const avgRating = meetingBourbon.reviews.length > 0
    ? (meetingBourbon.reviews.reduce((sum, r) => sum + r.rating, 0) / meetingBourbon.reviews.length).toFixed(1)
    : "—";

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bourbonId: meetingBourbon.bourbon.id,
        meetingBourbonId: meetingBourbon.id,
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
          <CardTitle className="text-lg">{meetingBourbon.bourbon.name}</CardTitle>
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
        {/* Existing reviews */}
        {meetingBourbon.reviews.map((review) => (
          <div key={review.id} className="border rounded-md p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{review.user.name || review.user.email}</span>
              <Badge variant="secondary">{review.rating}/10</Badge>
            </div>
            {review.nose && <p className="text-sm"><span className="text-muted-foreground">Nose:</span> {review.nose}</p>}
            {review.palate && <p className="text-sm"><span className="text-muted-foreground">Palate:</span> {review.palate}</p>}
            {review.finish && <p className="text-sm"><span className="text-muted-foreground">Finish:</span> {review.finish}</p>}
            {review.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {review.notes}</p>}
          </div>
        ))}

        {/* Review form */}
        {!myReview && !showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)}>Write Review</Button>
        )}
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
      </CardContent>
    </Card>
  );
}
