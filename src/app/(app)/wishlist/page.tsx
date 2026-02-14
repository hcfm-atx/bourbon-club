"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Plus, ThumbsUp, User } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  name: string;
  distillery: string | null;
  notes: string | null;
  createdAt: string;
  suggestedBy: string;
  voteCount: number;
  userVoted: boolean;
}

export default function WishlistPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    distillery: "",
    notes: "",
  });
  const [optimisticVotes, setOptimisticVotes] = useState<Map<string, { voted: boolean; count: number }>>(new Map());

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Bourbon name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newSuggestion = await res.json();
        toast.success("Suggestion added successfully", {
          description: `${formData.name} added to wishlist`
        });
        setFormData({ name: "", distillery: "", notes: "" });
        setShowForm(false);
        fetchSuggestions();
      } else {
        try {
          const error = await res.json();
          toast.error(error.error || "Failed to add suggestion");
        } catch {
          toast.error(`Failed to add suggestion (${res.status})`);
        }
      }
    } catch (error) {
      toast.error("Failed to add suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    const wasVoted = suggestion.userVoted;
    const previousCount = suggestion.voteCount;
    const newVoted = !wasVoted;
    const newCount = wasVoted ? previousCount - 1 : previousCount + 1;

    setOptimisticVotes(prev => new Map(prev).set(suggestionId, { voted: newVoted, count: newCount }));

    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        setOptimisticVotes(prev => {
          const next = new Map(prev);
          next.delete(suggestionId);
          return next;
        });
        fetchSuggestions();
      } else {
        setOptimisticVotes(prev => {
          const next = new Map(prev);
          next.delete(suggestionId);
          return next;
        });
        toast.error("Failed to vote", {
          action: { label: "Retry", onClick: () => handleVote(suggestionId) }
        });
      }
    } catch (error) {
      setOptimisticVotes(prev => {
        const next = new Map(prev);
        next.delete(suggestionId);
        return next;
      });
      toast.error("Failed to vote", {
        action: { label: "Retry", onClick: () => handleVote(suggestionId) }
      });
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
            Wishlist
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Suggest bourbons for the club to try and vote on your favorites
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="w-4 h-4 mr-2" />
          Add Suggestion
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Suggest a Bourbon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Bourbon Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Buffalo Trace"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Distillery <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <Input
                  value={formData.distillery}
                  onChange={(e) => setFormData({ ...formData, distillery: e.target.value })}
                  placeholder="e.g., Buffalo Trace Distillery"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Notes <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Why should we try this bourbon?"
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={submitting} className="min-h-[44px]">
                  {submitting ? "Adding..." : "Add Suggestion"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="min-h-[44px]">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-16 w-full mt-3" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No suggestions yet</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Be the first to suggest a bourbon for the club to try
            </p>
            <Button onClick={() => setShowForm(true)} className="min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Add Suggestion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const optimistic = optimisticVotes.get(suggestion.id);
            const displayVoted = optimistic ? optimistic.voted : suggestion.userVoted;
            const displayCount = optimistic ? optimistic.count : suggestion.voteCount;

            return (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{suggestion.name}</h3>
                      {suggestion.distillery && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {suggestion.distillery}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>Suggested by {suggestion.suggestedBy}</span>
                        <span>•</span>
                        <span>{getRelativeTime(suggestion.createdAt)}</span>
                      </div>
                      {suggestion.notes && (
                        <p className="text-sm mt-3 text-muted-foreground">{suggestion.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={displayVoted ? "default" : "outline"}
                        onClick={() => handleVote(suggestion.id)}
                        className="px-3"
                      >
                        <ThumbsUp
                          className={`w-4 h-4 ${displayVoted ? "fill-current" : ""}`}
                        />
                      </Button>
                      <Badge variant={displayCount > 0 ? "default" : "secondary"}>
                        {displayCount}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
