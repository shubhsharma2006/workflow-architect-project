import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { MousePointer2 } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import type { NodeType } from "@/types/workflow";
import { nodeTypes } from "../nodes";
import { CommandPalette } from "../topbar/CommandPalette";
import { NodeContextMenu, type CtxMenuState } from "../nodes/NodeContextMenu";

// Singleton ref to expose fitView from inside the provider to outside (topbar).
export const canvasFitViewRef: { current: null | ((opts?: { padding?: number; duration?: number }) => void) } = { current: null };

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>(null);
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    addNode, selectNode, undo, redo, showMinimap, duplicateNode, selectedId,
    groupSelected,
  } = useWorkflowStore();

  // Expose fitView to outside consumers (topbar button)
  useEffect(() => {
    canvasFitViewRef.current = (opts) => rf.fitView({ padding: opts?.padding ?? 0.2, duration: opts?.duration ?? 400 });
    return () => { canvasFitViewRef.current = null; };
  }, [rf]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow") as NodeType;
    if (!type) return;
    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(type, position);
  }, [rf, addNode]);

  // Keyboard shortcuts: ⌘/Ctrl+Z undo, ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y redo, ⌘/Ctrl+D duplicate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((key === "z" && e.shiftKey) || key === "y") { e.preventDefault(); redo(); }
      else if (key === "d" && selectedId) { e.preventDefault(); duplicateNode(selectedId); }
      else if (key === "g") { e.preventDefault(); groupSelected(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, duplicateNode, selectedId, groupSelected]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => selectNode(n.id)}
        onNodeContextMenu={(e, n) => {
          e.preventDefault();
          selectNode(n.id);
          setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: n.id });
        }}
        onPaneClick={() => { selectNode(null); setCtxMenu(null); }}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true, type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="hsl(var(--border))" />
        <Controls position="bottom-right" showInteractive={false} />
        {showMinimap && (
          <MiniMap
            position="bottom-left"
            pannable zoomable
            maskColor="hsl(var(--muted) / 0.6)"
            nodeColor={(n) => {
              const map: Record<string, string> = {
                start: "hsl(var(--node-start))",
                task: "hsl(var(--node-task))",
                approval: "hsl(var(--node-approval))",
                automated: "hsl(var(--node-automated))",
                end: "hsl(var(--node-end))",
              };
              return map[n.type || ""] || "hsl(var(--muted))";
            }}
          />
        )}
      </ReactFlow>

      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-border bg-card/70 px-8 py-10 text-center shadow-soft backdrop-blur animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <MousePointer2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Start building your workflow</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Drag a node from the palette on the left, or load a template from the top bar to get started.
            </p>
          </div>
        </div>
      )}

      <CommandPalette />
      <NodeContextMenu state={ctxMenu} onClose={() => setCtxMenu(null)} />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
