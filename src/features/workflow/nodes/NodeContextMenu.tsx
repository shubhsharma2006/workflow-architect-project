import { useEffect } from "react";
import { Copy, Trash2, MousePointerClick } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";

export type CtxMenuState = { x: number; y: number; nodeId: string } | null;

type Props = {
  state: CtxMenuState;
  onClose: () => void;
};

export function NodeContextMenu({ state, onClose }: Props) {
  const { duplicateNode, deleteNode, selectNode } = useWorkflowStore();

  useEffect(() => {
    if (!state) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-ctx-menu]")) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const action = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div
      data-ctx-menu
      style={{ left: state.x, top: state.y }}
      className="fixed z-50 w-48 animate-fade-in rounded-xl border border-border bg-popover p-1 shadow-elegant"
    >
      <button
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent"
        onClick={action(() => selectNode(state.nodeId))}
      >
        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        Select & inspect
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent"
        onClick={action(() => duplicateNode(state.nodeId))}
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
        Duplicate
        <span className="ml-auto text-[10px] text-muted-foreground">⌘D</span>
      </button>
      <button
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10"
        onClick={action(() => deleteNode(state.nodeId))}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
