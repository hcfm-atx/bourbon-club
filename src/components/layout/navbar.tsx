"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, CalendarDays, Vote, GlassWater, Star, CreditCard,
  Users, Wallet, Settings, Menu, Moon, Sun, Trophy,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

const memberLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/polls", label: "Polls", icon: Vote },
  { href: "/bourbons", label: "Bourbons", icon: GlassWater },
  { href: "/ratings", label: "Ratings", icon: Star },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

const adminLinks: NavLink[] = [
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/admin/polls", label: "Polls", icon: Vote },
  { href: "/admin/bourbons", label: "Bourbons", icon: GlassWater },
  { href: "/admin/payments", label: "Dues", icon: CreditCard },
  { href: "/admin/treasury", label: "Treasury", icon: Wallet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface Club {
  id: string;
  name: string;
}

export function Navbar() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.systemRole === "SUPER_ADMIN";

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/clubs").then((r) => r.json()).then(setClubs);
    }
  }, [session?.user?.id]);

  if (!session) return null;

  const currentClub = clubs.find((c) => c.id === session.user.currentClubId) || clubs[0] || null;
  const superAdminLinks: NavLink[] = isSuperAdmin
    ? [{ href: "/admin/users", label: "Users", icon: Users }, { href: "/admin/clubs", label: "Clubs" }]
    : [];
  const links = pathname.startsWith("/admin") ? [...adminLinks, ...superAdminLinks] : memberLinks;

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
    router.refresh();
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4 shrink-0" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
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
              <Menu className="w-5 h-5" />
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
              {mounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground text-left flex items-center gap-2"
                >
                  {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
              )}
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
