import { Trash2, MousePointerClick, Copy, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkflowStore } from "@/store/workflowStore";
import { formConfig } from "./formConfig";
import { FieldRenderer } from "./FieldRenderer";
import type { NodeType } from "@/types/workflow";

const typeLabel: Record<NodeType, string> = {
  start: "Start", task: "Task", approval: "Approval", automated: "Automated", end: "End", group: "Group",
};

export function NodeInspector({ onCollapse }: { onCollapse?: () => void }) {
  const { nodes, edges, selectedId, updateNodeData, updateEdgeLabel, deleteNode, duplicateNode, errors } = useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedId);
  const outgoing = node ? edges.filter((e) => e.source === node.id) : [];
  const isApproval = node?.type === "approval";

  if (!node) {
    return (
      <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-gradient-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector</div>
            <h2 className="mt-1 text-base font-semibold">No selection</h2>
          </div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onCollapse}
              title="Collapse inspector"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <MousePointerClick className="h-5 w-5 text-accent-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Select a node to edit</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag a node from the palette, then click it on the canvas to configure.
          </p>
        </div>
      </aside>
    );
  }

  const fields = formConfig[node.type as NodeType];
  const data: any = node.data;
  const nodeErrors = errors.filter((e) => e.nodeId === node.id);

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-gradient-surface">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {typeLabel[node.type as NodeType]} node
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => duplicateNode(node.id)}
              title="Duplicate (⌘/Ctrl+D)"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteNode(node.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {onCollapse && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onCollapse}
                title="Collapse inspector"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <h2 className="mt-1 truncate text-base font-semibold">{data.title || "Untitled"}</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">ID: {node.id}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-5">
          {nodeErrors.length > 0 && (
            <div className="space-y-1 rounded-xl border border-warning/30 bg-warning/10 p-3">
              {nodeErrors.map((e, i) => (
                <p key={i} className="text-[11px] text-foreground">⚠ {e.message}</p>
              ))}
            </div>
          )}
          {fields.map((f) => {
            const v = data[f.name];
            const isEmpty =
              v === undefined ||
              v === null ||
              (typeof v === "string" && v.trim() === "");
            const invalid = !!f.required && isEmpty;
            return (
              <FieldRenderer
                key={f.name}
                field={f}
                value={v}
                data={data}
                onChange={(p) => updateNodeData(node.id, p)}
                invalid={invalid}
              />
            );
          })}

          {isApproval && outgoing.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-card p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Outgoing branches
              </div>
              {outgoing.map((e) => {
                const target = nodes.find((n) => n.id === e.target);
                return (
                  <div key={e.id} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      → {(target?.data as any)?.title || target?.type || e.target}
                    </Label>
                    <Input
                      value={(e.label as string) || ""}
                      placeholder="Label (e.g. Approved, Rejected)"
                      onChange={(ev) => updateEdgeLabel(e.id, ev.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
