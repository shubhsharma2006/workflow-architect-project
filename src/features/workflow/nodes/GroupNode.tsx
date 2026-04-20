import { memo, useState } from "react";
import { type NodeProps } from "reactflow";
import { ChevronDown, ChevronRight, Layers, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/workflowStore";
import { cn } from "@/lib/utils";

function GroupNodeInner(props: NodeProps) {
  const data: any = props.data || {};
  const collapsed = !!data.collapsed;
  const label = data.label || "Group";
  const childCount = data.childCount ?? 0;

  const toggleCollapse = useWorkflowStore((s) => s.toggleGroupCollapse);
  const renameGroup = useWorkflowStore((s) => s.renameGroup);
  const ungroup = useWorkflowStore((s) => s.ungroupNode);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const submitRename = () => {
    setEditing(false);
    if (draft.trim() && draft !== label) renameGroup(props.id, draft.trim());
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.04] backdrop-blur-sm transition-smooth",
        collapsed ? "shadow-node-selected" : "shadow-soft",
        props.selected && "border-primary ring-2 ring-primary/30",
      )}
      style={{
        width: collapsed ? 240 : (data.width ?? 320),
        height: collapsed ? 64 : (data.height ?? 220),
      }}
    >
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-primary/20 bg-primary/10 px-3 py-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(props.id); }}
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary/20"
          title={collapsed ? "Expand group" : "Collapse group"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <Layers className="h-3.5 w-3.5 text-primary" />
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") { setEditing(false); setDraft(label); }
            }}
            className="h-6 flex-1 px-1.5 text-xs"
          />
        ) : (
          <button
            onDoubleClick={() => setEditing(true)}
            className="flex-1 truncate text-left text-xs font-semibold text-foreground"
            title="Double-click to rename"
          >
            {label}
          </button>
        )}
        <span className="rounded-full border border-primary/30 bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {childCount} {childCount === 1 ? "node" : "nodes"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="Rename group"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); ungroup(props.id); }}
          title="Ungroup"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeInner);
