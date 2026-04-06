import { useState, useRef } from "react"
import { LayoutTemplate, PanelLeft, Columns2, Columns3, PanelRight, Eye, EyeOff, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from "lucide-react"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import type { ImperativePanelHandle } from "@/huemul/components/huemul-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Small helpers ────────────────────────────────────────────────────────────

function DemoHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function DemoPane({ label, color }: { label: string; color: string }) {
  return (
    <div className={cn("flex h-full min-h-40 items-center justify-center", color)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  )
}

function ExampleCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="h-56 overflow-hidden">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PageLayoutDemoPage() {
  const [rightPanelVisible, setRightPanelVisible] = useState(false)
  const [detailPanelVisible, setDetailPanelVisible] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  // Refs for programmatic collapse/expand
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const rightPanelRef = useRef<ImperativePanelHandle>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Page title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">HuemulPageLayout</h1>
          <Badge variant="secondary">Huemul UI</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Flexible page layout with an optional full-width header and 1–3 horizontally-resizable columns.
          Use the <code className="text-xs bg-muted px-1 rounded">show</code> prop on any column to toggle it conditionally.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── 1. Single column ────────────────────────────────────────────── */}
        <ExampleCard
          title="1 Column — no header"
          description="showHeader={false} · columns={[{ content }]}"
        >
          <HuemulPageLayout
            showHeader={false}
            columns={[
              { content: <DemoPane label="Main content" color="bg-blue-50" /> },
            ]}
          />
        </ExampleCard>

        {/* ── 2. Header + single column ───────────────────────────────────── */}
        <ExampleCard
          title="Header + 1 Column"
          description="header={…} · columns={[{ content }]}"
        >
          <HuemulPageLayout
            header={<DemoHeader title="Page Header" description="Full-width header bar" />}
            columns={[
              { content: <DemoPane label="Main content" color="bg-blue-50" /> },
            ]}
          />
        </ExampleCard>

        {/* ── 3. 2 columns ────────────────────────────────────────────────── */}
        <ExampleCard
          title="Header + 2 Columns"
          description="defaultSize={20} for sidebar, remainder auto-fills main"
        >
          <HuemulPageLayout
            header={<DemoHeader title="Page Header" description="Left sidebar + main content" />}
            columns={[
              { content: <DemoPane label="Sidebar" color="bg-violet-50" />, defaultSize: 25, minSize: 15 },
              { content: <DemoPane label="Main content" color="bg-blue-50" /> },
            ]}
          />
        </ExampleCard>

        {/* ── 4. 3 columns ────────────────────────────────────────────────── */}
        <ExampleCard
          title="Header + 3 Columns"
          description="Left sidebar · main · right panel · with grip handle"
        >
          <HuemulPageLayout
            withHandle
            header={<DemoHeader title="Page Header" description="Three-column layout" />}
            columns={[
              { content: <DemoPane label="Left" color="bg-violet-50" />, defaultSize: 20, minSize: 12 },
              { content: <DemoPane label="Main" color="bg-blue-50" /> },
              { content: <DemoPane label="Right" color="bg-green-50" />, defaultSize: 25, minSize: 15 },
            ]}
          />
        </ExampleCard>

        {/* ── 5. Toggle right panel ───────────────────────────────────────── */}
        <ExampleCard
          title="Conditional right panel"
          description='Toggle show={…} on the third column based on state'
        >
          <div className="h-full flex flex-col">
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
              <span className="text-xs text-muted-foreground mr-auto">Right panel is {rightPanelVisible ? "visible" : "hidden"}</span>
              <Button
                size="xs"
                variant="outline"
                className="hover:cursor-pointer gap-1.5"
                onClick={() => setRightPanelVisible((v) => !v)}
              >
                {rightPanelVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {rightPanelVisible ? "Hide" : "Show"} right panel
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <HuemulPageLayout
                showHeader={false}
                columns={[
                  { content: <DemoPane label="Sidebar" color="bg-violet-50" />, defaultSize: 25, minSize: 15 },
                  { content: <DemoPane label="Main" color="bg-blue-50" /> },
                  { content: <DemoPane label="Detail" color="bg-amber-50" />, defaultSize: 35, minSize: 20, show: rightPanelVisible },
                ]}
              />
            </div>
          </div>
        </ExampleCard>

        {/* ── 6. Toggle header + detail panel ────────────────────────────── */}
        <ExampleCard
          title="Multiple toggles"
          description="Toggle header visibility and a detail panel independently"
        >
          <div className="h-full flex flex-col">
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-muted/30">
              <Button
                size="xs"
                variant="outline"
                className="hover:cursor-pointer gap-1.5"
                onClick={() => setShowHeader((v) => !v)}
              >
                {showHeader ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHeader ? "Hide" : "Show"} header
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="hover:cursor-pointer gap-1.5"
                onClick={() => setDetailPanelVisible((v) => !v)}
              >
                {detailPanelVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {detailPanelVisible ? "Hide" : "Show"} detail
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <HuemulPageLayout
                showHeader={showHeader}
                header={<DemoHeader title="Page Header" description="Toggleable header" />}
                columns={[
                  { content: <DemoPane label="List" color="bg-violet-50" />, defaultSize: 35, minSize: 20 },
                  { content: <DemoPane label="Detail" color="bg-amber-50" />, defaultSize: 35, minSize: 20, show: detailPanelVisible },
                  { content: <DemoPane label="Context" color="bg-green-50" />, defaultSize: 30, minSize: 20 },
                ]}
              />
            </div>
          </div>
        </ExampleCard>

        {/* ── 7. Collapsible via drag ────────────────────────────────────── */}
        <ExampleCard
          title="Collapsible via drag"
          description="collapsible={true} — drag either handle to the edge to fully hide a panel"
        >
          <HuemulPageLayout
            withHandle
            showHeader={false}
            columns={[
              { content: <DemoPane label="Left (collapsible)" color="bg-violet-50" />, defaultSize: 25, minSize: 15, collapsible: true },
              { content: <DemoPane label="Main" color="bg-blue-50" /> },
              { content: <DemoPane label="Right (collapsible)" color="bg-green-50" />, defaultSize: 25, minSize: 15, collapsible: true },
            ]}
          />
        </ExampleCard>

        {/* ── 8. Programmatic collapse / expand ────────────────────────── */}
        <ExampleCard
          title="Programmatic collapse / expand"
          description="panelRef + ref.current.collapse() / expand() — full control from code"
        >
          <div className="h-full flex flex-col">
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
              <Button
                size="xs"
                variant="outline"
                className="hover:cursor-pointer gap-1.5"
                onClick={() => {
                  if (leftCollapsed) leftPanelRef.current?.expand()
                  else leftPanelRef.current?.collapse()
                }}
              >
                {leftCollapsed
                  ? <PanelLeftOpen className="w-3 h-3" />
                  : <PanelLeftClose className="w-3 h-3" />}
                {leftCollapsed ? "Expand" : "Collapse"} left
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="hover:cursor-pointer gap-1.5"
                onClick={() => {
                  if (rightCollapsed) rightPanelRef.current?.expand()
                  else rightPanelRef.current?.collapse()
                }}
              >
                {rightCollapsed
                  ? <PanelRightOpen className="w-3 h-3" />
                  : <PanelRightClose className="w-3 h-3" />}
                {rightCollapsed ? "Expand" : "Collapse"} right
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <HuemulPageLayout
                withHandle
                showHeader={false}
                columns={[
                  {
                    content: <DemoPane label="Left" color="bg-violet-50" />,
                    defaultSize: 25,
                    collapsible: true,
                    panelRef: leftPanelRef,
                    onCollapse: () => setLeftCollapsed(true),
                    onExpand: () => setLeftCollapsed(false),
                  },
                  { content: <DemoPane label="Main" color="bg-blue-50" /> },
                  {
                    content: <DemoPane label="Right" color="bg-green-50" />,
                    defaultSize: 25,
                    collapsible: true,
                    panelRef: rightPanelRef,
                    onCollapse: () => setRightCollapsed(true),
                    onExpand: () => setRightCollapsed(false),
                  },
                ]}
              />
            </div>
          </div>
        </ExampleCard>

      </div>

      {/* ── API reference ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden text-sm">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold">API Reference</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground">Prop</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Default</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["header", "ReactNode", "—", "Full-width header rendered above columns."],
                ["showHeader", "boolean", "true", "Toggle header visibility. Header must also be provided."],
                ["columns", "HuemulPageLayoutColumn[]", "required", "1–3 column definitions."],
                ["columns[n].content", "ReactNode", "required", "Content rendered inside this column."],
                ["columns[n].defaultSize", "number", "auto", "Initial size % (0–100). Auto-distributed if omitted."],
                ["columns[n].minSize", "number", "—", "Minimum size constraint (%)."],
                ["columns[n].maxSize", "number", "—", "Maximum size constraint (%)."],
                ["columns[n].show", "boolean", "true", "Falsy removes the column from DOM and redistributes space."],
                ["columns[n].collapsible", "boolean", "false", "Allows dragging the panel to 0 width (fully hidden)."],
                ["columns[n].collapsedSize", "number", "0", "Size (%) when collapsed. Only used when collapsible=true."],
                ["columns[n].onCollapse", "() => void", "—", "Called when the panel collapses."],
                ["columns[n].onExpand", "() => void", "—", "Called when the panel expands."],
                ["columns[n].panelRef", "RefObject<ImperativePanelHandle>", "—", "Imperative ref — call .collapse() / .expand() programmatically."],
                ["withHandle", "boolean", "false", "Show a visible grip on resize handles."],
                ["className", "string", "—", "Extra className on the outer wrapper."],
                ["headerClassName", "string", "—", "Extra className on the header strip."],
                ["bodyClassName", "string", "—", "Extra className on the columns area."],
              ].map(([prop, type, def, desc]) => (
                <tr key={prop} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-primary">{prop}</td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">{type}</td>
                  <td className="px-4 py-2 text-muted-foreground">{def}</td>
                  <td className="px-4 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Icon legend ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><PanelLeft className="w-3.5 h-3.5" /><span>1 column</span></div>
        <div className="flex items-center gap-1.5"><Columns2 className="w-3.5 h-3.5" /><span>2 columns</span></div>
        <div className="flex items-center gap-1.5"><Columns3 className="w-3.5 h-3.5" /><span>3 columns</span></div>
        <div className="flex items-center gap-1.5"><PanelRight className="w-3.5 h-3.5" /><span>conditional panel</span></div>
      </div>
    </div>
  )
}
