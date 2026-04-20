# HR Workflow Designer

A premium, drag-and-drop **HR Workflow Designer** built with React, React Flow, Zustand, and a config-driven dynamic form engine. Design workflows visually, validate them in real-time, and simulate execution against a mock API layer.

> Built for the Tredence Full-Stack Engineer case study.

## ✨ Features

- **5 node types** — Start · Task · Approval · Automated · End, each with custom styling and handle constraints
- **Drag-from-palette canvas** — React Flow with dotted background, smooth animated edges, minimap, zoom controls
- **Config-driven dynamic forms** — adding a new node type = one entry in `formConfig.ts`
- **Automated node with dynamic params** — fetches actions from a mock `/automations` API; selecting an action renders its params on the fly
- **Simulation engine** — BFS traversal from Start; produces a timestamped, animated execution log + visual timeline
- **Real-time validation** — missing Start/End, disconnected nodes, cycle detection, required-field checks; inline red borders as you type
- **🔐 Authentication** — Supabase email/password auth, protected routes, per-user data isolation
- **☁️ Cloud persistence** — workflows stored in Postgres with strict per-user RLS; "My workflows" dropdown to load any saved workflow
- **🕒 Version checkpoints** — named DB snapshots per workflow with one-click restore (capped at 50/workflow)
- **🗂 Collapsible node groups** — multi-select + Group (or `⌘/Ctrl+G`) to bundle nodes into a labeled cluster; collapse/expand and ungroup any time
- **Auto-save to localStorage** — debounced 500ms offline draft buffer, restored on next sign-in
- **Undo / Redo** with history middleware (50-step buffer)
- **⌘K command palette** — search any node by title or type, jump-and-zoom on Enter
- **Right-click context menu** on nodes → Duplicate / Delete
- **Keyboard shortcuts modal** (`?`) listing every shortcut
- **Templates** — Onboarding · Leave Approval · Document Verification
- **Auto-layout** (dagre-style) "Tidy up" + Fit-to-view + minimap toggle
- **Import / Export JSON**, **Load sample**, **Clear** — full workflow lifecycle utilities
- **Dark mode** with persisted preference
- **Premium UI** — semantic HSL design tokens, gradients, soft shadows, micro-interactions

## 🚀 Production checklist

Before going live, in the [Supabase dashboard](https://supabase.com/dashboard):
- **Auth → Providers → Email** → enable **"Confirm email"** so new sign-ups must verify their address
- **Auth → URL Configuration** → add your production domain to **Site URL** and **Redirect URLs**
- The `workflows` and `workflow_checkpoints` tables already enforce per-user RLS via `auth.uid() = user_id` — no further policy work required


## 🏗 Architecture

```
                    ┌─────────────────────────────┐
                    │       WorkflowTopbar        │
                    │ (validate · templates · …)  │
                    └─────────────────────────────┘
                                  │
   ┌──────────────┐   ┌────────────────────────┐   ┌──────────────────┐
   │ NodePalette  │ → │     WorkflowCanvas      │ ← │  NodeInspector   │
   │ (drag src)   │   │  (React Flow + nodes)   │   │ (dynamic forms)  │
   └──────────────┘   └────────────────────────┘   └──────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │  useWorkflowStore   │  ← single source of truth
                       │  (Zustand + history │
                       │   + autosave sub)   │
                       └─────────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │   mockApi.ts        │
                       │ getAutomations · …  │
                       └─────────────────────┘
```

```
src/
├── features/workflow/
│   ├── canvas/            WorkflowCanvas.tsx · autoLayout.ts
│   ├── nodes/             BaseNode + 5 typed nodes · NodeContextMenu
│   ├── sidebar/           NodePalette.tsx
│   ├── forms/             formConfig + FieldRenderer + NodeInspector
│   ├── simulation/        SimulationPanel.tsx (Timeline + Logs tabs)
│   ├── topbar/            WorkflowTopbar · CommandPalette · ShortcutsModal
│   └── sampleWorkflow.ts  3 prebuilt templates
├── store/workflowStore.ts ← Zustand + undo/redo + autosave subscription
├── api/mockApi.ts         ← getAutomations + simulateWorkflow
├── types/workflow.ts
└── pages/Index.tsx        ← 3-pane layout + hydration + real-time validation
```

## 🚀 Run locally

```bash
npm install
npm run dev
```

## 🧠 Design decisions

- **Zustand over Redux** — zero boilerplate, perfect for a single-feature app sharing one workflow object across views. The whole store fits in ~270 lines.
- **History middleware** — snapshots committed only on meaningful changes (drag-end, add, remove, connect, data update), never on every dragging frame. Keeps undo intuitive and memory bounded (50-step ring).
- **Autosave subscription** — debounced 500ms, listens to nodes/edges/name. Survives refresh; toast offers "Start fresh" to discard.
- **TanStack Query for `/automations`** — caches the action list with `staleTime: 5min`. Selecting different Automated nodes never refetches.
- **Config-driven forms** — `formConfig[nodeType]` → `FieldConfig[]`. Adding a new node type touches one config file; no canvas/inspector changes.
- **Mock API layer** — clean swap-point for a real backend later. The simulation engine in `mockApi.ts` mirrors a real worker's contract.
- **Semantic HSL tokens** — every color in `index.css` / `tailwind.config.ts`. Zero hex literals in components → dark mode works for free.
- **`React.memo` on node components** — prevents re-renders when unrelated state (logs, errors elsewhere) changes during simulation.

## 🧩 How to add a new node type (5 steps)

1. **Type union** — add it to `NodeType` in `src/types/workflow.ts`
2. **Default data** — add a case in `defaultDataFor()` in `src/store/workflowStore.ts`
3. **Visual node** — add a `makeNode(...)` entry in `src/features/workflow/nodes/index.tsx` (icon, color token, handle config)
4. **Form fields** — add `formConfig.<yourType> = [...]` in `src/features/workflow/forms/formConfig.ts`
5. **(Optional) Execution** — handle it in `simulateWorkflow()` in `src/api/mockApi.ts`

→ Zero changes to the canvas, inspector, palette, simulation panel, or validation. The architecture is open for extension.

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + Z` | Undo |
| `⌘/Ctrl + Shift + Z` | Redo |
| `⌘/Ctrl + D` | Duplicate selected node |
| `⌘/Ctrl + K` | Open command palette |
| `?` | Show shortcuts modal |
| Right-click node | Context menu |

## ✅ Case study checklist

- [x] React Flow canvas + 5 node types
- [x] Drag, connect, select, delete, duplicate
- [x] Dynamic, config-driven inspector
- [x] Automated dynamic params via mock API
- [x] Mock `/automations` + `/simulate`
- [x] Simulation panel — Timeline view + Log view
- [x] Real-time validation (Start/End/cycles/orphans/required)
- [x] Import/Export JSON + 3 templates
- [x] Undo/Redo, auto-layout, minimap toggle, fit-to-view
- [x] Dark mode, autosave/restore, command palette, shortcuts modal
- [x] Premium UI per references

## ⏭ What I'd build next with more time

- **Backend persistence** — Supabase tables (`workflows`, `runs`, `versions`) — the integration is already wired
- **Workflow version history** with diff view (snapshot each save → time travel)
- **Real integrations** — actual email/Slack via webhooks instead of mocked actions
- **Real-time collaboration** — Y.js + WebSockets on top of the same Zustand store
- **Role-based access** — viewer / editor / admin via the existing `user_roles` pattern
- **Collapsible node groups** — select multiple nodes → group into a labeled cluster
- **AI assistant** — "Build me an offboarding flow" → AI-generated nodes from natural language
