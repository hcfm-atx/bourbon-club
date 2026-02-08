"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  bourbons: { bourbon: { name: string } }[];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  }, []);

  const upcoming = meetings.filter((m) => new Date(m.date) >= new Date());
  const past = meetings.filter((m) => new Date(m.date) < new Date());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meetings</h1>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming</h2>
          {upcoming.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Past</h2>
          {past.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {meetings.length === 0 && <p className="text-muted-foreground">No meetings scheduled.</p>}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{meeting.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {new Date(meeting.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {meeting.location && ` — ${meeting.location}`}
        </p>
        {meeting.bourbons.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Bourbons: {meeting.bourbons.map((b) => b.bourbon.name).join(", ")}
          </p>
        )}
        <Link href={`/meetings/${meeting.id}`} className="mt-3 inline-block">
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
