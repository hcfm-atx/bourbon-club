"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Reaction {
  type: string;
  count: number;
  userReacted: boolean;
}

interface ReviewReactionsProps {
  reviewId: string;
}

const REACTION_CONFIG = [
  { type: "helpful", emoji: "👍", label: "Helpful" },
  { type: "agree", emoji: "🥃", label: "Agree" },
  { type: "interesting", emoji: "🤔", label: "Interesting" },
  { type: "great", emoji: "🔥", label: "Great" },
];

export function ReviewReactions({ reviewId }: ReviewReactionsProps) {
  const { data: session } = useSession();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadReactions = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reactions`);
      if (res.ok) {
        const data = await res.json();
        setReactions(data);
      }
    } catch (error) {
      console.error("Failed to load reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReactions();
  }, [reviewId]);

  const toggleReaction = async (type: string) => {
    if (!session?.user?.id) {
      toast.error("You must be signed in to react");
      return;
    }

    setToggling(type);

    // Optimistic update
    const previousReactions = [...reactions];
    setReactions((prev) =>
      prev.map((r) => {
        if (r.type === type) {
          return {
            ...r,
            count: r.userReacted ? r.count - 1 : r.count + 1,
            userReacted: !r.userReacted,
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/reviews/${reviewId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        // Revert on error
        setReactions(previousReactions);
        toast.error("Failed to update reaction");
      }
    } catch (error) {
      // Revert on error
      setReactions(previousReactions);
      toast.error("Failed to update reaction");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        {REACTION_CONFIG.map((config) => (
          <div
            key={config.type}
            className="h-8 w-20 bg-secondary animate-pulse rounded-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_CONFIG.map((config) => {
        const reaction = reactions.find((r) => r.type === config.type);
        const isActive = reaction?.userReacted || false;
        const count = reaction?.count || 0;

        return (
          <Button
            key={config.type}
            variant="outline"
            size="sm"
            onClick={() => toggleReaction(config.type)}
            disabled={toggling === config.type}
            className={`rounded-full gap-1.5 ${
              isActive
                ? "bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-600"
                : ""
            }`}
          >
            <span className="text-base">{config.emoji}</span>
            <span className="text-xs">{config.label}</span>
            {count > 0 && (
              <span className="text-xs font-semibold ml-0.5">({count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
