"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/meetings", label: "Meetings" },
  { href: "/polls", label: "Polls" },
  { href: "/bourbons", label: "Bourbons" },
  { href: "/ratings", label: "Ratings" },
  { href: "/payments", label: "Payments" },
];

const adminLinks = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/meetings", label: "Meetings" },
  { href: "/admin/polls", label: "Polls" },
  { href: "/admin/bourbons", label: "Bourbons" },
  { href: "/admin/payments", label: "Dues" },
  { href: "/admin/treasury", label: "Treasury" },
  { href: "/admin/settings", label: "Settings" },
];

interface Club {
  id: string;
  name: string;
}

export function Navbar() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.systemRole === "SUPER_ADMIN";

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/clubs").then((r) => r.json()).then(setClubs);
    }
  }, [session?.user?.id]);

  if (!session) return null;

  const currentClub = clubs.find((c) => c.id === session.user.currentClubId);
  const links = pathname.startsWith("/admin") ? adminLinks : memberLinks;

  const switchClub = async (clubId: string) => {
    setSwitching(true);
    await fetch("/api/clubs/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubId }),
    });
    await update(); // Refresh the JWT/session
    setClubMenuOpen(false);
    setSwitching(false);
    window.location.reload();
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="font-bold text-lg">
              {currentClub?.name || "Bourbon Club"}
            </Link>
            {clubs.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setClubMenuOpen(!clubMenuOpen)}
                  className="text-xs px-1.5 py-0.5 rounded border text-muted-foreground hover:text-foreground"
                  disabled={switching}
                >
                  {switching ? "..." : "\u25BC"}
                </button>
                {clubMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setClubMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-popover border rounded-md shadow-md z-50 min-w-[180px]">
                      {clubs.map((club) => (
                        <button
                          key={club.id}
                          onClick={() => switchClub(club.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                            club.id === session.user.currentClubId ? "font-bold" : ""
                          }`}
                        >
                          {club.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {isSuperAdmin && (
            <Link href="/admin/clubs">
              <Button variant="outline" size="sm">Clubs</Button>
            </Link>
          )}
          {isAdmin && (
            <Link href={pathname.startsWith("/admin") ? "/dashboard" : "/admin/members"}>
              <Button variant="outline" size="sm">
                {pathname.startsWith("/admin") ? "Member View" : "Admin"}
              </Button>
            </Link>
          )}
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              {session.user?.name || session.user?.email}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign Out
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col gap-1 mt-8">
              {clubs.length > 1 && (
                <>
                  <p className="px-3 text-xs text-muted-foreground font-medium uppercase">Switch Club</p>
                  {clubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => { switchClub(club.id); setOpen(false); }}
                      className={`px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                        club.id === session.user.currentClubId
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {club.name}
                    </button>
                  ))}
                  <hr className="my-2" />
                </>
              )}
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2" />
              {isSuperAdmin && (
                <Link
                  href="/admin/clubs"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Manage Clubs
                </Link>
              )}
              {isAdmin && (
                <Link
                  href={pathname.startsWith("/admin") ? "/dashboard" : "/admin/members"}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {pathname.startsWith("/admin") ? "Member View" : "Admin Panel"}
                </Link>
              )}
              <Link href="/profile" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground">
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground text-left"
              >
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
