import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const groups: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "History",
    items: [
      { keys: ["⌘/Ctrl", "Z"], label: "Undo" },
      { keys: ["⌘/Ctrl", "Shift", "Z"], label: "Redo" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["⌘/Ctrl", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Show this help" },
    ],
  },
  {
    title: "Canvas",
    items: [
      { keys: ["⌘/Ctrl", "D"], label: "Duplicate selected node" },
      { keys: ["Right-click"], label: "Open node context menu" },
      { keys: ["Drag"], label: "Add node from palette" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Expose a programmatic opener via window event so topbar button can trigger
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("hr:open-shortcuts", handler);
    return () => window.removeEventListener("hr:open-shortcuts", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move faster on the canvas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </div>
              <div className="space-y-1.5">
                {g.items.map((it) => (
                  <div
                    key={it.label}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2"
                  >
                    <span className="text-sm">{it.label}</span>
                    <div className="flex items-center gap-1">
                      {it.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
