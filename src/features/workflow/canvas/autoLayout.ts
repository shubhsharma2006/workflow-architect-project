import dagre from "dagre";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

const NODE_W = 240;
const NODE_H = 84;

export function autoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: "LR" | "TB" = "LR"
): WorkflowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    };
  });
}
