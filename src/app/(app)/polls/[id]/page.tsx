"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface BourbonInfo {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  type: string;
  imageUrl: string | null;
}

interface PollOption {
  id: string;
  date: string | null;
  bourbonId: string | null;
  label: string | null;
  bourbon: BourbonInfo | null;
  selected: boolean;
  votes: { id: string; user: { id: string; name: string | null; email: string } }[];
}

interface Poll {
  id: string;
  title: string;
  type: "DATE" | "BOURBON";
  status: "OPEN" | "CLOSED";
  options: PollOption[];
}

export default function PollVotePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [optimisticSelected, setOptimisticSelected] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch(`/api/polls/${id}`).then((r) => r.json()).then((data: Poll) => {
      setPoll(data);
      if (session?.user?.id) {
        const myVotes = new Set<string>();
        data.options.forEach((o) => {
          if (o.votes.some((v) => v.user.id === session.user.id)) {
            myVotes.add(o.id);
          }
        });
        setSelected(myVotes);
      }
    });
  }, [id, session?.user?.id]);

  const toggleOption = (optionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const submitVotes = async () => {
    const previousSelected = new Set(selected);
    setSaving(true);
    setOptimisticSelected(new Set(selected));

    const res = await fetch(`/api/polls/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: Array.from(selected) }),
    });

    if (res.ok) {
      toast.success("Votes submitted");
      setOptimisticSelected(null);
      const updated = await fetch(`/api/polls/${id}`).then((r) => r.json());
      setPoll(updated);
    } else {
      setOptimisticSelected(null);
      setSelected(previousSelected);
      toast.error("Failed to submit votes", {
        action: { label: "Retry", onClick: submitVotes }
      });
    }
    setSaving(false);
  };

  const displaySelected = optimisticSelected !== null ? optimisticSelected : selected;

  if (!poll) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Polls
        </Link>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 md:space-y-6">
      <Breadcrumbs />
      <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Polls
      </Link>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">{poll.title}</h1>
        <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
      </div>
      <div className="grid gap-3">
        {poll.options.map((option) => (
          <Card key={option.id} className={option.selected ? "border-green-500" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {poll.status === "OPEN" && (
                    <Checkbox
                      checked={displaySelected.has(option.id)}
                      onCheckedChange={() => toggleOption(option.id)}
                    />
                  )}
                  <div>
                    {poll.type === "BOURBON" && option.bourbon ? (
                      <>
                        <p className="font-medium">{option.bourbon.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.bourbon.distillery || "Unknown distillery"}
                          {option.bourbon.proof && ` — ${option.bourbon.proof}°`}
                          {option.bourbon.type && ` · ${option.bourbon.type.replace("_", " ")}`}
                        </p>
                      </>
                    ) : option.date ? (
                      <p className="font-medium">
                        {new Date(option.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                    ) : (
                      <p className="font-medium">{option.label || "Option"}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {option.votes.length} vote{option.votes.length !== 1 ? "s" : ""}
                      {option.votes.length > 0 && ` — ${option.votes.map((v) => v.user.name || v.user.email).join(", ")}`}
                    </p>
                  </div>
                </div>
                {option.selected && <Badge variant="default">Selected</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {poll.status === "OPEN" && (
        <Button onClick={submitVotes} disabled={saving} className="w-full min-h-[44px]">
          {saving ? "Submitting..." : "Submit Votes"}
        </Button>
      )}
    </div>
  );
}
