import { useEffect, useMemo, useState } from "react";
import { useReactFlow } from "reactflow";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkflowStore } from "@/store/workflowStore";
import { Workflow, ListChecks, ShieldCheck, Bot, Flag, Layers } from "lucide-react";
import type { NodeType } from "@/types/workflow";

const iconFor: Record<NodeType, any> = {
  start: Flag, task: ListChecks, approval: ShieldCheck, automated: Bot, end: Flag, group: Layers,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { nodes, selectNode } = useWorkflowStore();
  const rf = useReactFlow();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        title: (n.data as any)?.title || n.type || n.id,
        type: (n.type || "task") as NodeType,
        x: n.position.x,
        y: n.position.y,
      })),
    [nodes]
  );

  const jump = (id: string, x: number, y: number) => {
    selectNode(id);
    rf.setCenter(x + 110, y + 50, { zoom: 1.2, duration: 500 });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[480px]">
        <Command>
          <CommandInput placeholder="Search nodes by title or type..." />
          <CommandList>
            <CommandEmpty>No nodes found.</CommandEmpty>
            <CommandGroup heading="Jump to node">
              {items.map((it) => {
                const Icon = iconFor[it.type] || Workflow;
                return (
                  <CommandItem
                    key={it.id}
                    value={`${it.title} ${it.type} ${it.id}`}
                    onSelect={() => jump(it.id, it.x, it.y)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{it.title}</span>
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {it.type}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
