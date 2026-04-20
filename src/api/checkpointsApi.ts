import { supabase } from "@/integrations/supabase/client";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type Checkpoint = {
  id: string;
  workflow_id: string;
  name: string;
  data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  created_at: string;
};

const MAX_PER_WORKFLOW = 50;

export async function listCheckpoints(workflowId: string): Promise<Checkpoint[]> {
  const { data, error } = await supabase
    .from("workflow_checkpoints")
    .select("id, workflow_id, name, data, created_at")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Checkpoint[];
}

export async function createCheckpoint(
  workflowId: string,
  name: string,
  data: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
): Promise<Checkpoint> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: row, error } = await supabase
    .from("workflow_checkpoints")
    .insert({ workflow_id: workflowId, user_id: user.id, name, data: data as any })
    .select("id, workflow_id, name, data, created_at")
    .single();
  if (error) throw error;

  // Cap at MAX_PER_WORKFLOW: delete oldest if exceeded
  const existing = await listCheckpoints(workflowId);
  if (existing.length > MAX_PER_WORKFLOW) {
    const toDelete = existing.slice(MAX_PER_WORKFLOW).map((c) => c.id);
    await supabase.from("workflow_checkpoints").delete().in("id", toDelete);
  }
  return row as unknown as Checkpoint;
}

export async function deleteCheckpoint(id: string): Promise<void> {
  const { error } = await supabase.from("workflow_checkpoints").delete().eq("id", id);
  if (error) throw error;
}
