import { create } from "zustand";
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "reactflow";
import type { NodeType, SimulationLog, ValidationError, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const AUTOSAVE_KEY = "hr-workflow-designer:autosave:v1";
export type PersistedWorkflow = {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  savedAt: number;
};

export function loadPersisted(): PersistedWorkflow | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) return null;
    return parsed as PersistedWorkflow;
  } catch {
    return null;
  }
}

export function clearPersisted() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* noop */ }
}

let idCounter = 1;
const nid = (t: string) => `${t}_${Date.now().toString(36)}_${idCounter++}`;

export const defaultDataFor = (type: NodeType): any => {
  switch (type) {
    case "start": return { kind: "start", title: "Start", metadata: [] };
    case "task": return { kind: "task", title: "New Task", description: "", assignee: "", dueDate: "", metadata: [] };
    case "approval": return { kind: "approval", title: "Approval", approverRole: "", threshold: 80 };
    case "automated": return { kind: "automated", title: "Automated Action", actionId: "", params: {} };
    case "end": return { kind: "end", title: "End", message: "Workflow completed", includeSummary: true };
  }
};

type Snapshot = { nodes: WorkflowNode[]; edges: WorkflowEdge[] };

const HISTORY_LIMIT = 50;

type State = {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedId: string | null;
  logs: SimulationLog[];
  errors: ValidationError[];
  isSimulating: boolean;

  past: Snapshot[];
  future: Snapshot[];

  showMinimap: boolean;
  toggleMinimap: () => void;

  showPalette: boolean;
  showInspector: boolean;
  showSimulation: boolean;
  togglePalette: () => void;
  toggleInspector: () => void;
  toggleSimulation: () => void;

  // Cloud persistence: which DB row is currently loaded (null = unsaved/local)
  loadedWorkflowId: string | null;
  setLoadedWorkflowId: (id: string | null) => void;

  setWorkflowName: (n: string) => void;
  onNodesChange: (c: NodeChange[]) => void;
  onEdgesChange: (c: EdgeChange[]) => void;
  onConnect: (c: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, patch: Record<string, any>) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  setLogs: (l: SimulationLog[]) => void;
  setErrors: (e: ValidationError[]) => void;
  setSimulating: (b: boolean) => void;
  clear: () => void;
  loadWorkflow: (data: { nodes: WorkflowNode[]; edges: WorkflowEdge[]; workflowName?: string; loadedWorkflowId?: string | null }) => void;
  applyLayout: (nodes: WorkflowNode[]) => void;

  // Group actions
  groupSelected: () => void;
  ungroupNode: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

const isCommittingNodeChange = (changes: NodeChange[]) =>
  changes.some(
    (c) =>
      c.type === "remove" ||
      c.type === "add" ||
      (c.type === "position" && (c as any).dragging === false)
  );

const isCommittingEdgeChange = (changes: EdgeChange[]) =>
  changes.some((c) => c.type === "remove" || c.type === "add");

export const useWorkflowStore = create<State>((set, get) => {
  const snapshot = (): Snapshot => ({ nodes: get().nodes, edges: get().edges });

  const commit = () => {
    const past = [...get().past, snapshot()].slice(-HISTORY_LIMIT);
    set({ past, future: [] });
  };

  return {
    workflowName: "Untitled HR Workflow",
    nodes: [],
    edges: [],
    selectedId: null,
    logs: [],
    errors: [],
    isSimulating: false,
    past: [],
    future: [],

    showMinimap: true,
    toggleMinimap: () => set({ showMinimap: !get().showMinimap }),

    showPalette: true,
    showInspector: true,
    showSimulation: true,
    togglePalette: () => set({ showPalette: !get().showPalette }),
    toggleInspector: () => set({ showInspector: !get().showInspector }),
    toggleSimulation: () => set({ showSimulation: !get().showSimulation }),

    loadedWorkflowId: null,
    setLoadedWorkflowId: (id) => set({ loadedWorkflowId: id }),

    setWorkflowName: (n) => set({ workflowName: n }),

    onNodesChange: (c) => {
      if (isCommittingNodeChange(c)) commit();
      set({ nodes: applyNodeChanges(c, get().nodes) as WorkflowNode[] });
    },
    onEdgesChange: (c) => {
      if (isCommittingEdgeChange(c)) commit();
      set({ edges: applyEdgeChanges(c, get().edges) });
    },
    onConnect: (c) => {
      commit();
      const sourceNode = get().nodes.find((n) => n.id === c.source);
      const isApproval = sourceNode?.type === "approval";
      const existingFromSource = get().edges.filter((e) => e.source === c.source);
      const branchLabel = isApproval
        ? existingFromSource.length === 0
          ? "Approved"
          : existingFromSource.length === 1
          ? "Rejected"
          : ""
        : "";
      set({
        edges: addEdge(
          {
            ...c,
            animated: true,
            type: "smoothstep",
            label: branchLabel || undefined,
            data: branchLabel ? { branch: branchLabel.toLowerCase() } : undefined,
          },
          get().edges
        ),
      });
    },
    addNode: (type, position) => {
      commit();
      const id = nid(type);
      const newNode: WorkflowNode = { id, type, position, data: defaultDataFor(type) };
      set({ nodes: [...get().nodes, newNode], selectedId: id });
    },
    selectNode: (id) => set({ selectedId: id }),
    updateNodeData: (id, patch) => {
      commit();
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } as any } : n
        ),
      });
    },
    updateEdgeLabel: (id, label) => {
      commit();
      set({
        edges: get().edges.map((e) =>
          e.id === id
            ? {
                ...e,
                label: label || undefined,
                data: { ...(e.data || {}), branch: label.toLowerCase() || undefined },
              }
            : e
        ),
      });
    },
    deleteNode: (id) => {
      commit();
      const node = get().nodes.find((n) => n.id === id);
      // If deleting a group, also drop its children's parent reference.
      if (node?.type === "group") {
        set({
          nodes: get().nodes
            .filter((n) => n.id !== id)
            .map((n) => (n.parentNode === id ? { ...n, parentNode: undefined, extent: undefined, hidden: false } : n)),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        });
        return;
      }
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        selectedId: get().selectedId === id ? null : get().selectedId,
      });
    },
    duplicateNode: (id) => {
      const src = get().nodes.find((n) => n.id === id);
      if (!src) return;
      commit();
      const newId = nid(src.type || "node");
      const clone: WorkflowNode = {
        ...src,
        id: newId,
        position: { x: src.position.x + 40, y: src.position.y + 40 },
        data: JSON.parse(JSON.stringify(src.data)),
        selected: false,
      };
      set({ nodes: [...get().nodes, clone], selectedId: newId });
    },
    setLogs: (l) => set({ logs: l }),
    setErrors: (e) => set({ errors: e }),
    setSimulating: (b) => set({ isSimulating: b }),
    clear: () => {
      commit();
      set({ nodes: [], edges: [], selectedId: null, logs: [], errors: [], loadedWorkflowId: null });
    },
    loadWorkflow: (data) => {
      commit();
      set({
        nodes: data.nodes,
        edges: data.edges,
        workflowName: data.workflowName ?? get().workflowName,
        selectedId: null,
        logs: [],
        errors: [],
        loadedWorkflowId: data.loadedWorkflowId ?? null,
      });
    },
    applyLayout: (nodes) => {
      commit();
      set({ nodes });
    },

    // ===== Group actions =====
    groupSelected: () => {
      const selected = get().nodes.filter((n) => n.selected && n.type !== "group" && !n.parentNode);
      if (selected.length < 2) return;
      commit();
      const PADDING = 40;
      const HEADER = 50;
      const minX = Math.min(...selected.map((n) => n.position.x));
      const minY = Math.min(...selected.map((n) => n.position.y));
      const maxX = Math.max(...selected.map((n) => n.position.x + (n.width ?? 240)));
      const maxY = Math.max(...selected.map((n) => n.position.y + (n.height ?? 100)));
      const groupId = nid("group");
      const width = maxX - minX + PADDING * 2;
      const height = maxY - minY + PADDING * 2 + HEADER;

      const groupNode: WorkflowNode = {
        id: groupId,
        type: "group" as any,
        position: { x: minX - PADDING, y: minY - PADDING - HEADER },
        data: { kind: "group", label: "New Group", collapsed: false, width, height, childCount: selected.length } as any,
      };

      const selectedIds = new Set(selected.map((n) => n.id));
      const updated: WorkflowNode[] = get().nodes.map((n) => {
        if (selectedIds.has(n.id)) {
          return {
            ...n,
            parentNode: groupId,
            extent: "parent",
            position: { x: n.position.x - (minX - PADDING), y: n.position.y - (minY - PADDING - HEADER) },
            selected: false,
          } as WorkflowNode;
        }
        return n;
      });
      // Insert group BEFORE its children so React Flow renders parent first.
      set({ nodes: [groupNode, ...updated], selectedId: groupId });
    },

    ungroupNode: (groupId) => {
      const group = get().nodes.find((n) => n.id === groupId);
      if (!group || group.type !== "group") return;
      commit();
      const offsetX = group.position.x;
      const offsetY = group.position.y;
      const next = get().nodes
        .filter((n) => n.id !== groupId)
        .map((n) => {
          if (n.parentNode === groupId) {
            return {
              ...n,
              parentNode: undefined,
              extent: undefined,
              hidden: false,
              position: { x: n.position.x + offsetX, y: n.position.y + offsetY },
            } as WorkflowNode;
          }
          return n;
        });
      set({
        nodes: next,
        edges: get().edges.filter((e) => e.source !== groupId && e.target !== groupId),
        selectedId: null,
      });
    },

    toggleGroupCollapse: (groupId) => {
      commit();
      const group = get().nodes.find((n) => n.id === groupId);
      if (!group) return;
      const nextCollapsed = !((group.data as any).collapsed);
      set({
        nodes: get().nodes.map((n) => {
          if (n.id === groupId) {
            return { ...n, data: { ...(n.data as any), collapsed: nextCollapsed } } as WorkflowNode;
          }
          if (n.parentNode === groupId) {
            return { ...n, hidden: nextCollapsed } as WorkflowNode;
          }
          return n;
        }),
      });
    },

    renameGroup: (groupId, name) => {
      commit();
      set({
        nodes: get().nodes.map((n) =>
          n.id === groupId ? ({ ...n, data: { ...(n.data as any), label: name } } as WorkflowNode) : n
        ),
      });
    },

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, -1);
      set({
        past: newPast,
        future: [snapshot(), ...future].slice(0, HISTORY_LIMIT),
        nodes: previous.nodes,
        edges: previous.edges,
        selectedId: null,
      });
    },
    redo: () => {
      const { past, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      const newFuture = future.slice(1);
      set({
        past: [...past, snapshot()].slice(-HISTORY_LIMIT),
        future: newFuture,
        nodes: next.nodes,
        edges: next.edges,
        selectedId: null,
      });
    },
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
  const errs: ValidationError[] = [];
  // Group nodes are visual containers, exclude from validation
  const executable = nodes.filter((n) => n.type !== "group");
  const starts = executable.filter((n) => n.type === "start");
  const ends = executable.filter((n) => n.type === "end");
  if (starts.length === 0) errs.push({ message: "Workflow must include a Start node", severity: "error" });
  if (starts.length > 1) errs.push({ message: "Only one Start node is allowed", severity: "error" });
  if (ends.length === 0) errs.push({ message: "Workflow must include an End node", severity: "error" });

  const connected = new Set<string>();
  edges.forEach((e) => { connected.add(e.source); connected.add(e.target); });
  executable.forEach((n) => {
    if (executable.length > 1 && !connected.has(n.id)) {
      errs.push({ nodeId: n.id, message: `"${(n.data as any)?.title || n.type}" is not connected`, severity: "warning" });
    }
    const d: any = n.data;
    if (n.type === "task" && !d.title?.trim()) errs.push({ nodeId: n.id, message: "Task is missing a title", severity: "warning" });
    if (n.type === "approval" && !d.approverRole) errs.push({ nodeId: n.id, message: "Approval needs an approver role", severity: "warning" });
    if (n.type === "automated" && !d.actionId) errs.push({ nodeId: n.id, message: "Automated node needs an action", severity: "warning" });
  });

  // cycle detection (skip groups)
  const adj = new Map<string, string[]>();
  edges.forEach((e) => { if (!adj.has(e.source)) adj.set(e.source, []); adj.get(e.source)!.push(e.target); });
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  executable.forEach((n) => color.set(n.id, WHITE));
  let hasCycle = false;
  const dfs = (u: string) => {
    color.set(u, GRAY);
    for (const v of adj.get(u) || []) {
      if (color.get(v) === GRAY) { hasCycle = true; return; }
      if (color.get(v) === WHITE) dfs(v);
    }
    color.set(u, BLACK);
  };
  for (const n of executable) if (color.get(n.id) === WHITE) dfs(n.id);
  if (hasCycle) errs.push({ message: "Workflow contains a cycle — must be a DAG", severity: "error" });

  return errs;
}

// ============= Autosave =============
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveListeners: Array<(at: number) => void> = [];
export function onAutosave(cb: (at: number) => void) {
  autosaveListeners.push(cb);
  return () => { autosaveListeners = autosaveListeners.filter((c) => c !== cb); };
}

if (typeof window !== "undefined") {
  useWorkflowStore.subscribe((state, prev) => {
    if (
      state.nodes === prev.nodes &&
      state.edges === prev.edges &&
      state.workflowName === prev.workflowName
    ) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        const payload: PersistedWorkflow = {
          workflowName: state.workflowName,
          nodes: state.nodes,
          edges: state.edges,
          savedAt: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        autosaveListeners.forEach((cb) => cb(payload.savedAt));
      } catch { /* quota or serialization issue — silently ignore */ }
    }, 500);
  });
}
