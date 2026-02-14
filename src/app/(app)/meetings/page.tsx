"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Check, HelpCircle, X, CalendarDays, Clock } from "lucide-react";

type RsvpStatus = "GOING" | "MAYBE" | "NOT_GOING";

interface Rsvp {
  id: string;
  status: RsvpStatus;
  user: { id: string; name: string | null; email: string };
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  bourbons: { bourbon: { name: string } }[];
  rsvps: Rsvp[];
}

function getDateKey(dateStr: string) {
  // Extract YYYY-MM-DD directly from ISO string to avoid timezone issues
  return dateStr.split("T")[0];
}

export default function MeetingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then(setMeetings)
      .finally(() => setLoading(false));
  }, []);

  const nowKey = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date.split("T")[0] >= nowKey);
  const past = meetings.filter((m) => m.date.split("T")[0] < nowKey);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-32 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Meetings</h1>

      <MeetingCalendar meetings={meetings} />

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Upcoming</h2>
          {upcoming.map((meeting, index) => (
            <MeetingCard key={meeting.id} meeting={meeting} userId={session?.user?.id} isNext={index === 0} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Past</h2>
          {past.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} userId={session?.user?.id} />
          ))}
        </div>
      )}

      {meetings.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No meetings scheduled"
          description="There are no upcoming or past meetings at the moment. Check back soon or contact an admin to schedule one."
          actionLabel={isAdmin ? "Schedule a Meeting" : undefined}
          actionHref={isAdmin ? "/admin/meetings" : undefined}
        />
      )}
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

function MeetingCountdown({ meeting }: { meeting: Meeting }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const meetingDate = new Date(meeting.date).getTime();
      const diff = meetingDate - now;

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [meeting.date]);

  return (
    <div className="flex items-center gap-2 text-amber-600">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">
        {countdown.days}d {countdown.hours}h {countdown.minutes}m until meeting
      </span>
    </div>
  );
}

function MeetingCard({ meeting, userId, isNext }: { meeting: Meeting; userId?: string; isNext?: boolean }) {
  const myRsvp = meeting.rsvps.find((r) => r.user.id === userId);
  const goingCount = meeting.rsvps.filter((r) => r.status === "GOING").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <CardTitle className="text-base md:text-lg">{meeting.title}</CardTitle>
          {myRsvp && (
            <Badge variant={myRsvp.status === "GOING" ? "default" : "outline"} className="ml-2">
              {myRsvp.status === "GOING" && <Check className="w-3 h-3 mr-1" />}
              {myRsvp.status === "MAYBE" && <HelpCircle className="w-3 h-3 mr-1" />}
              {myRsvp.status === "NOT_GOING" && <X className="w-3 h-3 mr-1" />}
              {myRsvp.status === "GOING" && "Going"}
              {myRsvp.status === "MAYBE" && "Maybe"}
              {myRsvp.status === "NOT_GOING" && "Can't Make It"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {new Date(meeting.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {meeting.location && ` \u2014 ${meeting.location}`}
        </p>
        {isNext && <div className="mt-2"><MeetingCountdown meeting={meeting} /></div>}
        {meeting.bourbons.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Bourbons: {meeting.bourbons.map((b) => b.bourbon.name).join(", ")}
          </p>
        )}
        {goingCount > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {goingCount} {goingCount === 1 ? "person" : "people"} going
          </p>
        )}
        <Link href={`/meetings/${meeting.id}`} className="mt-3 inline-block w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px]">View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
