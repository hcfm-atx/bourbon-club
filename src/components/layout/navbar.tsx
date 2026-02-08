"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!session) return null;

  const links = pathname.startsWith("/admin") ? adminLinks : memberLinks;

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg">
            Bourbon Club
          </Link>
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
