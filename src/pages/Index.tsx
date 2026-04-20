import { useEffect } from "react";
import { toast } from "sonner";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PanelBottomClose, PanelBottomOpen } from "lucide-react";
import { WorkflowTopbar } from "@/features/workflow/topbar/WorkflowTopbar";
import { NodePalette } from "@/features/workflow/sidebar/NodePalette";
import { WorkflowCanvas } from "@/features/workflow/canvas/WorkflowCanvas";
import { NodeInspector } from "@/features/workflow/forms/NodeInspector";
import { SimulationPanel } from "@/features/workflow/simulation/SimulationPanel";
import { ShortcutsModal } from "@/features/workflow/topbar/ShortcutsModal";
import { useWorkflowStore, loadPersisted, clearPersisted, validateWorkflow } from "@/store/workflowStore";
import { sampleOnboardingWorkflow } from "@/features/workflow/sampleWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const { nodes, edges, loadWorkflow, setErrors } = useWorkflowStore();
  const {
    showPalette, showInspector, showSimulation,
    togglePalette, toggleInspector, toggleSimulation,
  } = useWorkflowStore();
  const { user } = useAuth();

  // Real-time validation
  useEffect(() => {
    setErrors(validateWorkflow(nodes, edges));
  }, [nodes, edges, setErrors]);

  // On mount (and when user changes), restore local draft or load sample
  useEffect(() => {
    if (!user) return;
    if (nodes.length > 0) return;
    const saved = loadPersisted();
    if (saved && saved.nodes.length > 0) {
      loadWorkflow({ nodes: saved.nodes, edges: saved.edges, workflowName: saved.workflowName });
      toast("Restored your previous local draft", {
        description: "Save it to the cloud for permanent storage.",
        action: {
          label: "Start fresh",
          onClick: () => {
            clearPersisted();
            loadWorkflow(sampleOnboardingWorkflow());
          },
        },
      });
    } else {
      loadWorkflow(sampleOnboardingWorkflow());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    document.title = "HR Workflow Designer — Build, simulate & ship workflows";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Design, validate and simulate HR workflows with a premium drag-and-drop canvas, dynamic forms, cloud persistence, and version checkpoints.");
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <WorkflowTopbar />
      <div className="flex min-h-0 flex-1">
        {/* Left Palette — collapsible */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300 ease-smooth",
            showPalette ? "w-72" : "w-0"
          )}
        >
          <NodePalette onCollapse={togglePalette} />
        </div>

        {/* Center — canvas + simulation */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">HR Workflow Designer canvas</h1>

          {/* Floating toggle when palette is closed */}
          {!showPalette && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-2 z-20 h-8 w-8 rounded-lg border-border bg-card/80 shadow-soft backdrop-blur-sm hover:bg-accent"
              onClick={togglePalette}
              title="Show palette"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}

          {/* Floating toggle when inspector is closed */}
          {!showInspector && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 z-20 h-8 w-8 rounded-lg border-border bg-card/80 shadow-soft backdrop-blur-sm hover:bg-accent"
              onClick={toggleInspector}
              title="Show inspector"
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}

          {/* Floating toggle when simulation is closed */}
          {!showSimulation && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-2 left-1/2 z-20 h-8 w-8 -translate-x-1/2 rounded-lg border-border bg-card/80 shadow-soft backdrop-blur-sm hover:bg-accent"
              onClick={toggleSimulation}
              title="Show execution preview"
            >
              <PanelBottomOpen className="h-4 w-4" />
            </Button>
          )}

          <div className="relative min-h-0 flex-1">
            <WorkflowCanvas />
          </div>

          {/* Bottom Panel — collapsible */}
          <div
            className={cn(
              "shrink-0 overflow-hidden transition-all duration-300 ease-smooth",
              showSimulation ? "h-72" : "h-0"
            )}
          >
            <SimulationPanel onCollapse={toggleSimulation} />
          </div>
        </main>

        {/* Right Inspector — collapsible */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300 ease-smooth",
            showInspector ? "w-[340px]" : "w-0"
          )}
        >
          <NodeInspector onCollapse={toggleInspector} />
        </div>
      </div>
      <ShortcutsModal />
    </div>
  );
};

export default Index;
