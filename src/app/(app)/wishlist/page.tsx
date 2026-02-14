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
        toast.success("Suggestion added successfully");
        setFormData({ name: "", distillery: "", notes: "" });
        setShowForm(false);
        fetchSuggestions();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add suggestion");
      }
    } catch (error) {
      toast.error("Failed to add suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        fetchSuggestions();
      } else {
        toast.error("Failed to vote");
      }
    } catch (error) {
      toast.error("Failed to vote");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-amber-600" />
            Wishlist
          </h1>
          <p className="text-muted-foreground mt-1">
            Suggest bourbons for the club to try and vote on your favorites
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Suggestion"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
            <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to suggest a bourbon for the club to try
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Suggestion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
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
                      variant={suggestion.userVoted ? "default" : "outline"}
                      onClick={() => handleVote(suggestion.id)}
                      className="px-3"
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${suggestion.userVoted ? "fill-current" : ""}`}
                      />
                    </Button>
                    <Badge variant={suggestion.voteCount > 0 ? "default" : "secondary"}>
                      {suggestion.voteCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
