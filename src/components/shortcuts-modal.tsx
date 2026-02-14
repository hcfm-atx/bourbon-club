"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: ["⌘", "K"],
    description: "Open command palette",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "K"],
    description: "Open command palette (Windows/Linux)",
    category: "Navigation",
  },
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
    category: "Help",
  },
  {
    keys: ["T"],
    description: "Toggle theme (dark/light)",
    category: "Settings",
  },
  {
    keys: ["ESC"],
    description: "Close modals and dialogs",
    category: "Navigation",
  },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "?" && !isInput && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // T for theme toggle
      if (e.key === "t" && !isInput && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Dispatch a custom event that the navbar can listen to
        window.dispatchEvent(new CustomEvent("toggle-theme"));
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce<Record<string, Shortcut[]>>((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  const categories = Object.keys(groupedShortcuts);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate the app more efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="grid gap-2">
                {groupedShortcuts[category].map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          Press <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">?</kbd> to toggle this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
