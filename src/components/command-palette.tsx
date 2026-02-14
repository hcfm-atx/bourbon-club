"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  CalendarDays,
  Vote,
  GlassWater,
  Star,
  CreditCard,
  Trophy,
  Heart,
  User,
  Plus,
  Moon,
  Sun,
  ChevronRight,
  Search,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  keywords?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
}

export function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bourbons, setBourbons] = useState<Bourbon[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isAdmin = session?.user?.clubRole === "ADMIN" || session?.user?.systemRole === "SUPER_ADMIN";

  // Fetch bourbons for search
  useEffect(() => {
    if (session?.user?.id && open) {
      fetch("/api/bourbons")
        .then((r) => r.json())
        .then((data) => setBourbons(data))
        .catch(() => setBourbons([]));
    }
  }, [session?.user?.id, open]);

  // Build command items
  const buildCommands = useCallback((): CommandItem[] => {
    const commands: CommandItem[] = [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Dashboard",
        category: "Pages",
        keywords: ["home"],
        icon: LayoutDashboard,
        action: () => { router.push("/dashboard"); setOpen(false); },
      },
      {
        id: "nav-meetings",
        label: "Meetings",
        category: "Pages",
        keywords: ["events", "calendar"],
        icon: CalendarDays,
        action: () => { router.push("/meetings"); setOpen(false); },
      },
      {
        id: "nav-bourbons",
        label: "Bourbons",
        category: "Pages",
        keywords: ["bottles", "whiskey"],
        icon: GlassWater,
        action: () => { router.push("/bourbons"); setOpen(false); },
      },
      {
        id: "nav-polls",
        label: "Polls",
        category: "Pages",
        keywords: ["voting", "vote"],
        icon: Vote,
        action: () => { router.push("/polls"); setOpen(false); },
      },
      {
        id: "nav-ratings",
        label: "Ratings",
        category: "Pages",
        keywords: ["reviews", "scores"],
        icon: Star,
        action: () => { router.push("/ratings"); setOpen(false); },
      },
      {
        id: "nav-leaderboard",
        label: "Leaderboard",
        category: "Pages",
        keywords: ["rankings", "top"],
        icon: Trophy,
        action: () => { router.push("/leaderboard"); setOpen(false); },
      },
      {
        id: "nav-wishlist",
        label: "Wishlist",
        category: "Pages",
        keywords: ["suggestions", "want"],
        icon: Heart,
        action: () => { router.push("/wishlist"); setOpen(false); },
      },
      {
        id: "nav-payments",
        label: "Payments",
        category: "Pages",
        keywords: ["dues", "money"],
        icon: CreditCard,
        action: () => { router.push("/payments"); setOpen(false); },
      },
      {
        id: "nav-profile",
        label: "Profile",
        category: "Pages",
        keywords: ["settings", "account"],
        icon: User,
        action: () => { router.push("/profile"); setOpen(false); },
      },
      // Quick Actions
      {
        id: "action-add-bourbon",
        label: "Add Bourbon",
        category: "Actions",
        keywords: ["create", "new"],
        icon: Plus,
        action: () => { router.push("/bourbons"); setOpen(false); },
      },
      {
        id: "action-create-poll",
        label: "Create Poll",
        category: "Actions",
        keywords: ["new", "vote"],
        icon: Plus,
        action: () => { router.push("/polls"); setOpen(false); },
      },
      // Settings
      {
        id: "theme-toggle",
        label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        category: "Settings",
        keywords: ["dark", "light", "appearance"],
        icon: theme === "dark" ? Sun : Moon,
        action: () => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); },
      },
    ];

    // Add bourbons to search
    bourbons.forEach((bourbon) => {
      commands.push({
        id: `bourbon-${bourbon.id}`,
        label: bourbon.name,
        category: "Bourbons",
        keywords: [bourbon.distillery || ""].filter(Boolean),
        icon: GlassWater,
        action: () => { router.push(`/bourbons/${bourbon.id}`); setOpen(false); },
      });
    });

    return commands;
  }, [router, theme, setTheme, bourbons]);

  const commands = buildCommands();

  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter((cmd) => {
        const searchLower = search.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.category.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  // Group by category
  const groupedCommands = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const categoryOrder = ["Pages", "Actions", "Bourbons", "Settings"];
  const sortedCategories = Object.keys(groupedCommands).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Flatten for keyboard navigation
  const flatCommands = sortedCategories.flatMap((cat) => groupedCommands[cat]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Update selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation within dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatCommands.length) % flatCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatCommands[selectedIndex]) {
        flatCommands[selectedIndex].action();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 gap-0 max-w-2xl bg-background/95 backdrop-blur-xl border-border/60"
        showCloseButton={false}
      >
        <div className="flex items-center border-b border-border/60 px-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search pages, actions, bourbons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {flatCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results found for &quot;{search}&quot;
            </div>
          ) : (
            <>
              {sortedCategories.map((category) => (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {groupedCommands[category].map((cmd) => {
                      const globalIndex = flatCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          }`}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          {Icon && (
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? "text-amber-600" : "text-muted-foreground"
                              }`}
                            />
                          )}
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-border/60 px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↑↓
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↵
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ESC
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
