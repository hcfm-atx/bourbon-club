"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Vote, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

interface ActivityEvent {
  id: string;
  type: "review" | "poll" | "payment";
  description: string;
  createdAt: string;
}

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const visibleEvents = expanded ? events : events.slice(0, 3);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <h2 className="text-xl font-bold">Recent Activity</h2>
        {open ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {open && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {visibleEvents.map((event, index) => {
                const isLast = index === visibleEvents.length - 1;
                const iconColor = event.type === "review" ? "bg-amber-500" : event.type === "poll" ? "bg-blue-500" : "bg-green-500";
                const Icon = event.type === "review" ? Star : event.type === "poll" ? Vote : CreditCard;

                return (
                  <div key={event.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`${iconColor} rounded-full p-2 flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      {!isLast && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRelativeTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              {events.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground"
                >
                  {expanded ? "Show less" : `Show ${events.length - 3} more`}
                </Button>
              )}
              <Link
                href="/activity"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                View all activity &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
