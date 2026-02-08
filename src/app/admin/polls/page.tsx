"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Poll {
  id: string;
  title: string;
  type: "DATE" | "BOURBON";
  status: "OPEN" | "CLOSED";
  createdAt: string;
  options: { id: string; date: string | null; label: string | null; votes: { id: string }[] }[];
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    fetch("/api/polls").then((r) => r.json()).then(setPolls);
  }, []);

  const deletePoll = async (id: string) => {
    if (!confirm("Delete this poll?")) return;
    const res = await fetch(`/api/polls/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPolls((prev) => prev.filter((p) => p.id !== id));
      toast.success("Poll deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Polls</h1>
        <Link href="/admin/polls/new">
          <Button>Create Poll</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {poll.options.length} {poll.type === "BOURBON" ? "bourbon" : "date"} options &middot; {poll.options.reduce((sum, o) => sum + o.votes.length, 0)} total votes
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/polls/${poll.id}`}>
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deletePoll(poll.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {polls.length === 0 && <p className="text-muted-foreground">No polls yet.</p>}
      </div>
    </div>
  );
}
