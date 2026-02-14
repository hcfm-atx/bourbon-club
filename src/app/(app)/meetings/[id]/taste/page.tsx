"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const CATEGORIES = [
  { key: "appearance", scoreKey: "appearanceScore", notesKey: "appearanceNotes", label: "Appearance" },
  { key: "nose", scoreKey: "noseScore", notesKey: "nose", label: "Nose" },
  { key: "taste", scoreKey: "tasteScore", notesKey: "palate", label: "Taste" },
  { key: "mouthfeel", scoreKey: "mouthfeelScore", notesKey: "mouthfeel", label: "Mouthfeel" },
  { key: "finish", scoreKey: "finishScore", notesKey: "finish", label: "Finish" },
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

interface BourbonScores {
  appearance: number;
  nose: number;
  taste: number;
  mouthfeel: number;
  finish: number;
}

interface BourbonNotes {
  appearance: string;
  nose: string;
  taste: string;
  mouthfeel: string;
  finish: string;
  general: string;
}

export default function LiveTastingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<BourbonScores>({ appearance: 5, nose: 5, taste: 5, mouthfeel: 5, finish: 5 });
  const [notes, setNotes] = useState<BourbonNotes>({ appearance: "", nose: "", taste: "", mouthfeel: "", finish: "", general: "" });
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadMeeting = async () => {
    const res = await fetch(`/api/meetings/${id}`);
    const data = await res.json();
    setMeeting(data);
  };

  useEffect(() => {
    loadMeeting();
  }, [id]);

  useEffect(() => {
    // Pre-populate scores if user already has a review for current bourbon
    if (meeting && meeting.bourbons[currentIndex]) {
      const currentBourbon = meeting.bourbons[currentIndex];
      const myReview = currentBourbon.reviews.find((r) => r.user.id === session?.user?.id);

      if (myReview) {
        setScores({
          appearance: myReview.appearanceScore ?? 5,
          nose: myReview.noseScore ?? 5,
          taste: myReview.tasteScore ?? 5,
          mouthfeel: myReview.mouthfeelScore ?? 5,
          finish: myReview.finishScore ?? 5,
        });
        setNotes({
          appearance: myReview.appearanceNotes ?? "",
          nose: myReview.nose ?? "",
          taste: myReview.palate ?? "",
          mouthfeel: myReview.mouthfeel ?? "",
          finish: myReview.finish ?? "",
          general: myReview.notes ?? "",
        });
      } else {
        // Reset to defaults for new bourbon
        setScores({ appearance: 5, nose: 5, taste: 5, mouthfeel: 5, finish: 5 });
        setNotes({ appearance: "", nose: "", taste: "", mouthfeel: "", finish: "", general: "" });
      }
      setExpandedCategory(null);
    }
  }, [currentIndex, meeting, session?.user?.id]);

  if (!meeting) return <p className="p-4">Loading...</p>;

  if (meeting.bourbons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
        <p className="text-muted-foreground">No bourbons assigned to this meeting yet.</p>
        <Button onClick={() => router.push(`/meetings/${id}`)}>Back to Meeting</Button>
      </div>
    );
  }

  const currentBourbon = meeting.bourbons[currentIndex];
  const myReview = currentBourbon.reviews.find((r) => r.user.id === session?.user?.id);
  const totalBourbons = meeting.bourbons.length;
  const overallScore = (Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);

  const allReviewsComplete = meeting.bourbons.every(
    (mb) => mb.reviews.some((r) => r.user.id === session?.user?.id)
  );

  const submitReview = async () => {
    setSaving(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bourbonId: currentBourbon.bourbon.id,
        meetingBourbonId: currentBourbon.id,
        appearanceScore: scores.appearance,
        appearanceNotes: notes.appearance || null,
        noseScore: scores.nose,
        nose: notes.nose || null,
        tasteScore: scores.taste,
        palate: notes.taste || null,
        mouthfeelScore: scores.mouthfeel,
        mouthfeel: notes.mouthfeel || null,
        finishScore: scores.finish,
        finish: notes.finish || null,
        notes: notes.general || null,
      }),
    });

    if (res.ok) {
      toast.success("Review submitted");
      await loadMeeting();

      // Auto-advance to next bourbon if not at the end
      if (currentIndex < totalBourbons - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to submit review");
    }
    setSaving(false);
  };

  const goNext = () => {
    if (currentIndex < totalBourbons - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Completion screen
  if (allReviewsComplete && myReview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900">
          <Check className="w-10 h-10 text-green-600 dark:text-green-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">All Done!</h1>
          <p className="text-muted-foreground">
            You've reviewed all {totalBourbons} bourbon{totalBourbons !== 1 ? "s" : ""} in this tasting.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => router.push(`/meetings/${id}`)} className="w-full">
            View Meeting Details
          </Button>
          <Button variant="outline" onClick={() => setCurrentIndex(0)} className="w-full">
            Review Scores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/meetings/${id}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <Badge variant="secondary">
            Bourbon {currentIndex + 1} of {totalBourbons}
          </Badge>
        </div>
        <h1 className="text-xl font-bold truncate">{meeting.title}</h1>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Bourbon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{currentBourbon.bourbon.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentBourbon.bourbon.distillery}
              {currentBourbon.bourbon.proof && ` — ${currentBourbon.bourbon.proof}°`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
              <p className="text-5xl font-bold">{overallScore}</p>
              <p className="text-sm text-muted-foreground">/10</p>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Categories */}
        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <Card key={cat.key}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{cat.label}</h3>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {scores[cat.key as keyof BourbonScores]}/10
                  </Badge>
                </div>

                {/* Number Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      variant={scores[cat.key as keyof BourbonScores] === num ? "default" : "outline"}
                      className="h-14 text-lg font-semibold"
                      onClick={() => setScores((prev) => ({ ...prev, [cat.key]: num }))}
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                {/* Notes Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                >
                  {expandedCategory === cat.key ? "Hide" : "Add"} notes
                </Button>

                {/* Notes Textarea */}
                {expandedCategory === cat.key && (
                  <Textarea
                    value={notes[cat.key as keyof BourbonNotes]}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    placeholder={`${cat.label} notes (optional)...`}
                    rows={3}
                    className="w-full"
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* General Notes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Additional Notes</h3>
              <Textarea
                value={notes.general}
                onChange={(e) => setNotes((prev) => ({ ...prev, general: e.target.value }))}
                placeholder="Other thoughts..."
                rows={3}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        {myReview ? (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You've already reviewed this bourbon
            </p>
            <Badge variant="secondary">{myReview.rating.toFixed(1)}/10</Badge>
          </div>
        ) : (
          <Button
            onClick={submitReview}
            disabled={saving}
            className="w-full h-14 text-lg font-semibold"
          >
            {saving ? "Submitting..." : "Submit Review"}
          </Button>
        )}

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="h-12"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentIndex === totalBourbons - 1}
            className="h-12"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
