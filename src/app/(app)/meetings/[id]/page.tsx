"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sparkles, Check, HelpCircle, X, ChevronDown, ChevronUp, Download, ArrowLeft, Star } from "lucide-react";
import { generateMeetingPdf } from "@/lib/meeting-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";

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

type RsvpStatus = "GOING" | "MAYBE" | "NOT_GOING";

interface Rsvp {
  id: string;
  status: RsvpStatus;
  user: { id: string; name: string | null; email: string };
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [myRsvp, setMyRsvp] = useState<RsvpStatus | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadMeeting = () => {
    fetch(`/api/meetings/${id}`).then((r) => r.json()).then(setMeeting);
  };

  const loadRsvps = () => {
    fetch(`/api/meetings/${id}/rsvp`)
      .then((r) => r.json())
      .then((data: Rsvp[]) => {
        setRsvps(data);
        const mine = data.find((r) => r.user.id === session?.user?.id);
        setMyRsvp(mine?.status || null);
      });
  };

  useEffect(() => {
    loadMeeting();
    loadRsvps();
  }, [id]);

  const handleExportPdf = () => {
    if (!meeting) return;
    setGeneratingPdf(true);
    try {
      generateMeetingPdf(meeting, rsvps);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!meeting) {
    return (
      <div className="space-y-6">
        <Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Meetings
        </Link>
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-full max-w-xl mt-2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Meetings
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{meeting.title}</h1>
        <p className="text-muted-foreground">
          {new Date(meeting.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {meeting.location && ` — ${meeting.location}`}
        </p>
        {meeting.description && <p className="mt-2">{meeting.description}</p>}
        <div className="flex gap-2 mt-4">
          {meeting.bourbons.length > 0 && (
            <Button
              onClick={() => router.push(`/meetings/${id}/taste`)}
              variant="default"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Live Tasting Mode
            </Button>
          )}
          <Button
            onClick={handleExportPdf}
            variant="outline"
            disabled={generatingPdf}
          >
            <Download className="w-4 h-4 mr-2" />
            {generatingPdf ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <RsvpSection
        meetingId={id}
        myRsvp={myRsvp}
        rsvps={rsvps}
        onRsvpChanged={loadRsvps}
      />

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

function RsvpSection({
  meetingId,
  myRsvp,
  rsvps,
  onRsvpChanged,
}: {
  meetingId: string;
  myRsvp: RsvpStatus | null;
  rsvps: Rsvp[];
  onRsvpChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const setRsvp = async (status: RsvpStatus) => {
    setSaving(true);
    const res = await fetch(`/api/meetings/${meetingId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("RSVP updated");
      onRsvpChanged();
    } else {
      toast.error("Failed to update RSVP");
    }
    setSaving(false);
  };

  const goingCount = rsvps.filter((r) => r.status === "GOING").length;
  const maybeCount = rsvps.filter((r) => r.status === "MAYBE").length;
  const notGoingCount = rsvps.filter((r) => r.status === "NOT_GOING").length;

  const goingUsers = rsvps.filter((r) => r.status === "GOING");
  const maybeUsers = rsvps.filter((r) => r.status === "MAYBE");
  const notGoingUsers = rsvps.filter((r) => r.status === "NOT_GOING");

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSVP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={myRsvp === "GOING" ? "default" : "outline"}
            onClick={() => setRsvp("GOING")}
            disabled={saving}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Going
          </Button>
          <Button
            variant={myRsvp === "MAYBE" ? "default" : "outline"}
            onClick={() => setRsvp("MAYBE")}
            disabled={saving}
            className="flex-1"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Maybe
          </Button>
          <Button
            variant={myRsvp === "NOT_GOING" ? "default" : "outline"}
            onClick={() => setRsvp("NOT_GOING")}
            disabled={saving}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Can&apos;t Make It
          </Button>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{goingCount}</span> going
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{maybeCount}</span> maybe
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{notGoingCount}</span> can&apos;t make it
              </span>
            </div>
            {rsvps.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>

          {showDetails && rsvps.length > 0 && (
            <div className="mt-4 space-y-3">
              {goingUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                    Going ({goingUsers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {goingUsers.map((r) => (
                      <Badge key={r.id} variant="secondary">
                        {r.user.name || r.user.email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {maybeUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1 text-amber-600" />
                    Maybe ({maybeUsers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {maybeUsers.map((r) => (
                      <Badge key={r.id} variant="secondary">
                        {r.user.name || r.user.email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {notGoingUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <X className="w-4 h-4 mr-1 text-red-600" />
                    Can&apos;t Make It ({notGoingUsers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {notGoingUsers.map((r) => (
                      <Badge key={r.id} variant="secondary">
                        {r.user.name || r.user.email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
