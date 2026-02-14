"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface Poll {
  id: string;
  title: string;
  type: "DATE" | "BOURBON";
  status: "OPEN" | "CLOSED";
  options: { id: string; date: string | null; label: string | null; selected: boolean; votes: { id: string; userId: string }[] }[];
}

export default function PollsPage() {
  const { data: session } = useSession();
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
              <div className="space-y-1">
                <CardTitle className="text-lg">{poll.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={poll.status === "OPEN" ? "default" : "secondary"}>{poll.status}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {poll.type === "BOURBON" ? "Bourbon" : "Date"} Poll
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {poll.options.length} options
                  {" · "}{poll.options.reduce((sum, o) => sum + o.votes.length, 0)} votes
                  {session?.user?.id && poll.options.some(o => o.votes.some(v => v.userId === session.user.id)) && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">Voted</Badge>
                  )}
                </div>
                <Link href={`/polls/${poll.id}`}>
                  <Button size="sm" variant={poll.status === "OPEN" ? "default" : "outline"}>
                    {poll.status === "OPEN" ? "Vote Now" : "View Results"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {polls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No polls available yet.</p>
            {(session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN") && (
              <Link href="/admin/polls">
                <Button className="mt-3">Create a Poll</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
