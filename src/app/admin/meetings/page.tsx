"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  bourbons: { bourbon: { name: string } }[];
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const { confirm: confirmDialog, dialogProps } = useConfirmDialog();

  useEffect(() => {
    fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  }, []);

  const deleteMeeting = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete Meeting",
      description: "Delete this meeting?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      toast.success("Meeting deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <Link href="/admin/meetings/new">
          <Button>Create Meeting</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardHeader>
              <CardTitle className="text-lg">{meeting.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {new Date(meeting.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                {meeting.location && ` — ${meeting.location}`}
              </p>
              {meeting.bourbons.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Bourbons: {meeting.bourbons.map((b) => b.bourbon.name).join(", ")}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Link href={`/admin/meetings/${meeting.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deleteMeeting(meeting.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {meetings.length === 0 && <p className="text-muted-foreground">No meetings yet.</p>}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
