"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BourbonInfo {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  type: string;
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

export default function AdminPollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);

  useEffect(() => {
    fetch(`/api/polls/${id}`).then((r) => r.json()).then(setPoll);
  }, [id]);

  const closePoll = async (selectedOptionId: string) => {
    const message = poll?.type === "BOURBON"
      ? "Close this poll and create a meeting with the selected bourbon?"
      : "Close this poll and create a meeting for the selected date?";
    if (!confirm(message)) return;
    const res = await fetch(`/api/polls/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOptionId, createMeeting: true }),
    });
    if (res.ok) {
      toast.success("Poll closed and meeting created");
      router.push("/admin/meetings");
    } else {
      toast.error("Failed to close poll");
    }
  };

  if (!poll) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{poll.title}</h1>
        <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
        {poll.type === "BOURBON" && <Badge variant="outline">Bourbon Poll</Badge>}
      </div>
      <div className="grid gap-4">
        {poll.options.map((option) => (
          <Card key={option.id} className={option.selected ? "border-green-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {poll.type === "BOURBON" && option.bourbon ? (
                  <span>
                    {option.bourbon.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {option.bourbon.distillery && `${option.bourbon.distillery} · `}
                      {option.bourbon.proof && `${option.bourbon.proof}°`}
                    </span>
                  </span>
                ) : option.date ? (
                  new Date(option.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                ) : (
                  option.label || "Option"
                )}
              </CardTitle>
              <Badge variant="secondary">{option.votes.length} votes</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-3">
                {option.votes.map((v) => (
                  <p key={v.id} className="text-sm text-muted-foreground">{v.user.name || v.user.email}</p>
                ))}
                {option.votes.length === 0 && <p className="text-sm text-muted-foreground">No votes</p>}
              </div>
              {poll.status === "OPEN" && (
                <Button size="sm" onClick={() => closePoll(option.id)}>
                  Select &amp; Close Poll
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
