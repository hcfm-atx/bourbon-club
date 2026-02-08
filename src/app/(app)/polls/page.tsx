"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Poll {
  id: string;
  title: string;
  status: "OPEN" | "CLOSED";
  options: { id: string; date: string; selected: boolean; votes: { id: string }[] }[];
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    fetch("/api/polls").then((r) => r.json()).then(setPolls);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Polls</h1>
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {poll.options.length} date options
              </p>
              <Link href={`/polls/${poll.id}`}>
                <Button variant="outline" size="sm">
                  {poll.status === "OPEN" ? "Vote" : "View Results"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {polls.length === 0 && <p className="text-muted-foreground">No polls available.</p>}
      </div>
    </div>
  );
}
