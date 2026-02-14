"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";

interface BreadcrumbSegment {
  label: string;
  href: string;
  isCurrent: boolean;
}

// Map path segments to readable names
const segmentNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  meetings: "Meetings",
  bourbons: "Bourbons",
  polls: "Polls",
  ratings: "Ratings",
  leaderboard: "Leaderboard",
  wishlist: "Wishlist",
  payments: "Payments",
  profile: "Profile",
  admin: "Admin",
  members: "Members",
  settings: "Settings",
  clubs: "Clubs",
  users: "Users",
  treasury: "Treasury",
  taste: "Live Tasting",
  activity: "Activity",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const [resourceNames, setResourceNames] = useState<Record<string, string>>({});

  // Parse pathname into segments
  const segments = pathname.split("/").filter(Boolean);

  // Fetch resource names for IDs (bourbons, meetings, polls)
  useEffect(() => {
    const fetchResourceNames = async () => {
      const names: Record<string, string> = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const prevSegment = i > 0 ? segments[i - 1] : null;

        // Check if this segment is likely an ID (UUID pattern or numeric)
        const isId = /^[a-f0-9-]{36}$|^\d+$/.test(segment);

        if (isId && prevSegment) {
          try {
            let url = "";
            let labelKey = "";

            if (prevSegment === "bourbons") {
              url = `/api/bourbons/${segment}`;
              labelKey = "name";
            } else if (prevSegment === "meetings") {
              url = `/api/meetings/${segment}`;
              labelKey = "title";
            } else if (prevSegment === "polls") {
              url = `/api/polls/${segment}`;
              labelKey = "title";
            }

            if (url) {
              const res = await fetch(url);
              if (res.ok) {
                const data = await res.json();
                names[segment] = data[labelKey] || segment;
              }
            }
          } catch {
            // If fetch fails, keep the ID as is
          }
        }
      }

      setResourceNames(names);
    };

    if (segments.length > 0) {
      fetchResourceNames();
    }
  }, [pathname]);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbSegment[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isCurrent = index === segments.length - 1;

    let label = segmentNameMap[segment] || resourceNames[segment] || segment;

    // Capitalize first letter if no mapping exists
    if (!segmentNameMap[segment] && !resourceNames[segment]) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return { label, href, isCurrent };
  });

  // Mobile: Show only last 2 segments with ellipsis
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const displayBreadcrumbs = isMobile && breadcrumbs.length > 2
    ? [
        { label: "...", href: "#", isCurrent: false },
        ...breadcrumbs.slice(-2),
      ]
    : breadcrumbs;

  // Don't show breadcrumbs on root pages
  if (segments.length === 0 || segments.length === 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <li>
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only md:not-sr-only">Home</span>
          </Link>
        </li>
        {displayBreadcrumbs.map((crumb, index) => (
          <li key={crumb.href + index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            {crumb.isCurrent ? (
              <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
                {crumb.label}
              </span>
            ) : crumb.label === "..." ? (
              <span className="text-muted-foreground">...</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors truncate max-w-[150px] md:max-w-none"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
