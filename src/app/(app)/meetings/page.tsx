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

function getDateKey(dateStr: string) {
  // Extract YYYY-MM-DD directly from ISO string to avoid timezone issues
  return dateStr.split("T")[0];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetch("/api/meetings").then((r) => r.json()).then(setMeetings);
  }, []);

  const nowKey = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date.split("T")[0] >= nowKey);
  const past = meetings.filter((m) => m.date.split("T")[0] < nowKey);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meetings</h1>

      <MeetingCalendar meetings={meetings} />

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

function MeetingCalendar({ meetings }: { meetings: Meeting[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });

  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();

  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const startOffset = firstDay.getUTCDay();
  const daysInMonth = lastDay.getUTCDate();

  const prevMonth = () => setCurrentMonth(new Date(Date.UTC(year, month - 1, 1)));
  const nextMonth = () => setCurrentMonth(new Date(Date.UTC(year, month + 1, 1)));

  // Map meetings by date key (YYYY-MM-DD)
  const meetingsByDate: Record<string, Meeting[]> = {};
  for (const m of meetings) {
    const key = getDateKey(m.date);
    if (!meetingsByDate[key]) meetingsByDate[key] = [];
    meetingsByDate[key].push(m);
  }

  const todayKey = new Date().toISOString().split("T")[0];

  const monthLabel = firstDay.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <Button variant="ghost" size="sm" onClick={prevMonth}>&larr;</Button>
        <CardTitle className="text-base">{monthLabel}</CardTitle>
        <Button variant="ghost" size="sm" onClick={nextMonth}>&rarr;</Button>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
          {days.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayMeetings = meetingsByDate[dateKey] || [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={`py-1 relative ${isToday ? "font-bold" : ""}`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                  {day}
                </span>
                {dayMeetings.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayMeetings.map((m) => (
                      <Link key={m.id} href={`/meetings/${m.id}`}>
                        <div className="text-[10px] leading-tight truncate bg-primary/15 text-primary rounded px-1 py-0.5 hover:bg-primary/25 transition-colors mx-0.5">
                          {m.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
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
          {new Date(meeting.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {meeting.location && ` \u2014 ${meeting.location}`}
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
