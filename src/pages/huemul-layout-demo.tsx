import { useState, useRef, type ReactNode } from "react"
import { LayoutTemplate } from "lucide-react"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import type { ImperativePanelHandle } from "@/huemul/components/huemul-page-layout"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Shared helpers ────────────────────────────────────────────────────────────

const PANE_COLORS = {
  blue:   "bg-blue-50   border-blue-200   text-blue-800   dark:bg-blue-950/40   dark:border-blue-700   dark:text-blue-200",
  green:  "bg-green-50  border-green-200  text-green-800  dark:bg-green-950/40  dark:border-green-700  dark:text-green-200",
  purple: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-200",
  amber:  "bg-amber-50  border-amber-200  text-amber-800  dark:bg-amber-950/40  dark:border-amber-700  dark:text-amber-200",
  teal:   "bg-teal-50   border-teal-200   text-teal-800   dark:bg-teal-950/40   dark:border-teal-700   dark:text-teal-200",
  rose:   "bg-rose-50   border-rose-200   text-rose-800   dark:bg-rose-950/40   dark:border-rose-700   dark:text-rose-200",
} as const

function Pane({ label, color = "blue" }: { label: string; color?: keyof typeof PANE_COLORS }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-full w-full border rounded text-xs font-medium select-none",
        PANE_COLORS[color],
      )}
    >
      {label}
    </div>
  )
}

function DemoShell({ children, height = "h-64" }: { children: ReactNode; height?: string }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background shadow-sm", height)}>
      {children}
    </div>
  )
}

function DemoCard({
  title,
  description,
  tags,
  children,
}: {
  title: string
  description: string
  tags?: string[]
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground/80 uppercase">{title}</h2>
      <Separator className="mt-1.5" />
    </div>
  )
}

// ─── Demos — Column Layout ─────────────────────────────────────────────────────

function SingleColumnDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        columns={[{ content: <Pane label="Single Column" color="blue" /> }]}
      />
    </DemoShell>
  )
}

function TwoColumnsEqualDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        columns={[
          { content: <Pane label="Left (50%)" color="blue" /> },
          { content: <Pane label="Right (50%)" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function TwoColumnsCustomSizesDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        columns={[
          { content: <Pane label="Left (30%)" color="blue" />, defaultSize: 30, minSize: 15 },
          { content: <Pane label="Right (70%)" color="green" />, defaultSize: 70 },
        ]}
      />
    </DemoShell>
  )
}

function ThreeColumnsDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        columns={[
          { content: <Pane label="Left (20%)" color="blue" />, defaultSize: 20, minSize: 12 },
          { content: <Pane label="Center (60%)" color="green" />, defaultSize: 60 },
          { content: <Pane label="Right (20%)" color="purple" />, defaultSize: 20, minSize: 12 },
        ]}
      />
    </DemoShell>
  )
}

function NonResizableColumnsDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        columns={[
          { content: <Pane label="Fixed Left (30%)" color="blue" />, defaultSize: 30, resizable: false },
          { content: <Pane label="Main (70%) — no resize handle" color="green" />, defaultSize: 70 },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Global Header ─────────────────────────────────────────────────────

function WithGlobalHeaderDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        header={
          <div className="px-4 py-2 flex items-center gap-2 text-sm font-medium">
            <span>Page Title</span>
            <Badge variant="outline" className="text-xs">Full-Width Header</Badge>
          </div>
        }
        withHandle
        columns={[
          { content: <Pane label="Left" color="blue" />, defaultSize: 35 },
          { content: <Pane label="Right" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function ToggleHeaderDemo() {
  const [showHeader, setShowHeader] = useState(true)
  return (
    <DemoShell>
      <HuemulPageLayout
        header={
          <div className="px-4 py-2 flex items-center justify-between text-sm">
            <span className="font-medium">Page Header</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs hover:cursor-pointer"
              onClick={() => setShowHeader((v) => !v)}
            >
              {showHeader ? "Hide" : "Show"}
            </Button>
          </div>
        }
        showHeader={showHeader}
        columns={[{ content: <Pane label="Content" color="blue" /> }]}
      />
    </DemoShell>
  )
}

// ─── Demos — Column Visibility ─────────────────────────────────────────────────

function ToggleColumnDemo() {
  const [showRight, setShowRight] = useState(true)
  return (
    <DemoShell>
      <HuemulPageLayout
        header={
          <div className="px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Right column: {showRight ? "visible" : "hidden"}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs hover:cursor-pointer"
              onClick={() => setShowRight((v) => !v)}
            >
              {showRight ? "Hide" : "Show"} Column
            </Button>
          </div>
        }
        withHandle
        columns={[
          { content: <Pane label="Left" color="blue" /> },
          { content: <Pane label="Right" color="green" />, defaultSize: 40, show: showRight },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Collapsible Column ────────────────────────────────────────────────

function CollapsibleColumnDemo() {
  const panelRef = useRef<ImperativePanelHandle | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <DemoShell>
      <HuemulPageLayout
        header={
          <div className="px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Right panel: {collapsed ? "collapsed" : "expanded"}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs hover:cursor-pointer"
              onClick={() =>
                collapsed ? panelRef.current?.expand() : panelRef.current?.collapse()
              }
            >
              {collapsed ? "Expand" : "Collapse"}
            </Button>
          </div>
        }
        withHandle
        columns={[
          { content: <Pane label="Main" color="blue" /> },
          {
            content: <Pane label="Collapsible (drag or button)" color="green" />,
            defaultSize: 35,
            minSize: 15,
            collapsible: true,
            collapsedSize: 0,
            panelRef,
            onCollapse: () => setCollapsed(true),
            onExpand: () => setCollapsed(false),
          },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Fixed Column Sections ────────────────────────────────────────────

function FixedColumnHeaderDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            header: {
              content: (
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b bg-muted/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Fixed Column Header
                </div>
              ),
            },
          },
          { content: <Pane label="Right" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function FixedColumnFooterDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            footer: {
              content: (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                  Fixed Column Footer — Status: Ready
                </div>
              ),
            },
          },
          { content: <Pane label="Right" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function FixedHeaderAndFooterDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        columns={[
          {
            content: <Pane label="Scrollable Content" color="blue" />,
            header: {
              content: (
                <div className="px-3 py-1.5 text-xs font-medium border-b bg-muted/50">
                  Fixed Header — Toolbar / Filters
                </div>
              ),
            },
            footer: {
              content: (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
                  Fixed Footer — 128 items · Page 1 of 7
                </div>
              ),
            },
          },
        ]}
      />
    </DemoShell>
  )
}

function HiddenSectionDemo() {
  const [showHeader, setShowHeader] = useState(true)
  const [showFooter, setShowFooter] = useState(true)
  return (
    <DemoShell>
      <HuemulPageLayout
        header={
          <div className="px-4 py-2 flex items-center gap-2 text-xs">
            <Button
              size="sm"
              variant={showHeader ? "secondary" : "outline"}
              className="h-6 text-xs hover:cursor-pointer"
              onClick={() => setShowHeader((v) => !v)}
            >
              {showHeader ? "Hide" : "Show"} Col Header
            </Button>
            <Button
              size="sm"
              variant={showFooter ? "secondary" : "outline"}
              className="h-6 text-xs hover:cursor-pointer"
              onClick={() => setShowFooter((v) => !v)}
            >
              {showFooter ? "Hide" : "Show"} Col Footer
            </Button>
          </div>
        }
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            header: {
              show: showHeader,
              content: (
                <div className="px-3 py-1.5 text-xs font-medium border-b bg-muted/50">
                  Column Header (show: {String(showHeader)})
                </div>
              ),
            },
            footer: {
              show: showFooter,
              content: (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
                  Column Footer (show: {String(showFooter)})
                </div>
              ),
            },
          },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Resizable Column Sections ────────────────────────────────────────

function ResizableColumnHeaderDemo() {
  return (
    <DemoShell height="h-72">
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            header: {
              content: <Pane label="Resizable Header (drag handle below)" color="amber" />,
              resizable: true,
              defaultSize: 35,
              minSize: 15,
            },
          },
          { content: <Pane label="Right" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function ResizableColumnFooterDemo() {
  return (
    <DemoShell height="h-72">
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            footer: {
              content: <Pane label="Resizable Footer (drag handle above)" color="teal" />,
              resizable: true,
              defaultSize: 35,
              minSize: 15,
            },
          },
          { content: <Pane label="Right" color="green" /> },
        ]}
      />
    </DemoShell>
  )
}

function ResizableHeaderAndFooterDemo() {
  return (
    <DemoShell height="h-80">
      <HuemulPageLayout
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            header: {
              content: <Pane label="Resizable Header (25%)" color="amber" />,
              resizable: true,
              defaultSize: 25,
              minSize: 10,
            },
            footer: {
              content: <Pane label="Resizable Footer (25%)" color="teal" />,
              resizable: true,
              defaultSize: 25,
              minSize: 10,
            },
          },
        ]}
      />
    </DemoShell>
  )
}

function MixedFixedResizableDemo() {
  return (
    <DemoShell height="h-72">
      <HuemulPageLayout
        columns={[
          {
            content: <Pane label="Main Content" color="blue" />,
            header: {
              content: (
                <div className="px-3 py-1.5 text-xs font-medium border-b bg-muted/50">
                  Fixed Header — Toolbar
                </div>
              ),
              // resizable: false (default)
            },
            footer: {
              content: <Pane label="Resizable Footer — Details Panel" color="rose" />,
              resizable: true,
              defaultSize: 35,
              minSize: 15,
            },
          },
        ]}
      />
    </DemoShell>
  )
}

function CollapsibleSectionDemo() {
  const footerRef = useRef<ImperativePanelHandle | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <DemoShell height="h-72">
      <HuemulPageLayout
        columns={[
          {
            content: <Pane label="Content" color="blue" />,
            header: {
              content: (
                <div className="px-3 py-1.5 flex items-center justify-between border-b bg-muted/50">
                  <span className="text-xs font-medium">Fixed Header</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 text-xs hover:cursor-pointer"
                    onClick={() =>
                      collapsed ? footerRef.current?.expand() : footerRef.current?.collapse()
                    }
                  >
                    {collapsed ? "Expand" : "Collapse"} Footer
                  </Button>
                </div>
              ),
            },
            footer: {
              content: <Pane label="Collapsible + Resizable Footer" color="rose" />,
              resizable: true,
              defaultSize: 35,
              minSize: 15,
              collapsible: true,
              collapsedSize: 0,
              panelRef: footerRef,
              onCollapse: () => setCollapsed(true),
              onExpand: () => setCollapsed(false),
            },
          },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Pagination ──────────────────────────────────────────────────────

function PaginationOffsetDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalItems = 128
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center h-24 text-xs text-muted-foreground">
        Showing items {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
      </div>
      <HuemulPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
      />
    </div>
  )
}

function PaginationCursorDemo() {
  const TOTAL_PAGES = 5
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center h-24 text-xs text-muted-foreground">
        Page {page} of {TOTAL_PAGES} · {pageSize} per page (cursor-based — no totalItems)
      </div>
      <HuemulPagination
        page={page}
        pageSize={pageSize}
        hasNext={page < TOTAL_PAGES}
        hasPrevious={page > 1}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
      />
    </div>
  )
}

function PaginationNoSelectorDemo() {
  const [page, setPage] = useState(3)
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center h-24 text-xs text-muted-foreground">
        Without items-per-page selector
      </div>
      <HuemulPagination
        page={page}
        pageSize={25}
        totalItems={200}
        onPageChange={setPage}
      />
    </div>
  )
}

function PaginationNarrowDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalItems = 128
  return (
    <DemoShell height="h-56">
      <HuemulPageLayout
        withHandle
        columns={[
          {
            content: <Pane label="Wide column" color="blue" />,
            defaultSize: 65,
          },
          {
            content: (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  Narrow column — pagination wraps to vertical stack
                </div>
                <HuemulPagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                />
              </div>
            ),
            defaultSize: 35,
            minSize: 20,
          },
        ]}
      />
    </DemoShell>
  )
}

// ─── Demos — Direction ────────────────────────────────────────────────────────

function VerticalDirectionDemo() {
  return (
    <DemoShell>
      <HuemulPageLayout
        withHandle
        direction="vertical"
        columns={[
          { content: <Pane label="Top Row (30%)" color="blue" />, defaultSize: 30 },
          { content: <Pane label="Middle Row (40%)" color="green" />, defaultSize: 40 },
          { content: <Pane label="Bottom Row (30%)" color="purple" />, defaultSize: 30 },
        ]}
      />
    </DemoShell>
  )
}

function VerticalWithSectionsDemo() {
  return (
    <DemoShell height="h-80">
      <HuemulPageLayout
        withHandle
        direction="vertical"
        columns={[
          {
            content: <Pane label="Top (with col header)" color="blue" />,
            defaultSize: 50,
            header: {
              content: (
                <div className="px-3 py-1 text-xs font-medium border-b bg-muted/50">
                  Top Row — Fixed Header
                </div>
              ),
            },
          },
          {
            content: <Pane label="Bottom (with col footer)" color="green" />,
            defaultSize: 50,
            footer: {
              content: (
                <div className="px-3 py-1 text-xs text-muted-foreground border-t bg-muted/50">
                  Bottom Row — Fixed Footer
                </div>
              ),
            },
          },
        ]}
      />
    </DemoShell>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HuemulLayoutDemoPage() {
  return (
    <HuemulPageLayout
      header={
        <div className="px-6 py-3 flex items-center gap-3">
          <LayoutTemplate className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h1 className="text-sm font-semibold leading-none">HuemulPageLayout — Configuration Showcase</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All available layout configurations and prop combinations
            </p>
          </div>
        </div>
      }
      columns={[
        {
          content: (
            <div className="p-6 space-y-12">

              {/* ── Column Layout ── */}
              <section className="space-y-6">
                <SectionTitle title="Column Layout" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Single Column"
                    description="One column fills all available space. No ResizablePanel overhead is added."
                    tags={["columns × 1"]}
                  >
                    <SingleColumnDemo />
                  </DemoCard>
                  <DemoCard
                    title="Two Columns — Equal"
                    description="Two columns share space equally (50/50). withHandle shows a visible grip icon on the divider."
                    tags={["columns × 2", "withHandle: true"]}
                  >
                    <TwoColumnsEqualDemo />
                  </DemoCard>
                  <DemoCard
                    title="Two Columns — Custom Sizes"
                    description="Explicit defaultSize controls initial proportions. minSize prevents a column from collapsing too small."
                    tags={["defaultSize: 30 | 70", "minSize: 15"]}
                  >
                    <TwoColumnsCustomSizesDemo />
                  </DemoCard>
                  <DemoCard
                    title="Three Columns"
                    description="Up to three columns are supported. Sizes auto-normalise to 100% if they don't sum to it."
                    tags={["columns × 3", "defaultSize: 20 | 60 | 20"]}
                  >
                    <ThreeColumnsDemo />
                  </DemoCard>
                  <DemoCard
                    title="Non-Resizable Column"
                    description="resizable: false on a column disables the drag handle adjacent to it — useful for fixed sidebars."
                    tags={["resizable: false"]}
                  >
                    <NonResizableColumnsDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Global Header ── */}
              <section className="space-y-6">
                <SectionTitle title="Global Header" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="With Page Header"
                    description="Full-width header strip rendered above the columns. Pass any ReactNode."
                    tags={["header", "showHeader: true (default)"]}
                  >
                    <WithGlobalHeaderDemo />
                  </DemoCard>
                  <DemoCard
                    title="Toggle Header Visibility"
                    description="showHeader: false unmounts the header strip entirely."
                    tags={["showHeader: boolean"]}
                  >
                    <ToggleHeaderDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Column Visibility ── */}
              <section className="space-y-6">
                <SectionTitle title="Column Visibility & Collapsing" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Toggle Column (show prop)"
                    description="show: false removes the column from the layout. Sizes of remaining columns are automatically re-normalised."
                    tags={["show: boolean"]}
                  >
                    <ToggleColumnDemo />
                  </DemoCard>
                  <DemoCard
                    title="Collapsible Column + Programmatic Control"
                    description="collapsible: true allows dragging to zero. panelRef lets you call collapse() / expand() from code."
                    tags={["collapsible: true", "collapsedSize: 0", "panelRef", "onCollapse", "onExpand"]}
                  >
                    <CollapsibleColumnDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Column Sections — Fixed ── */}
              <section className="space-y-6">
                <SectionTitle title="Column Sections — Fixed (resizable: false)" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Fixed Column Header"
                    description="header.content renders a fixed-height strip above the column's scrollable content area."
                    tags={["header.content", "header.resizable: false (default)"]}
                  >
                    <FixedColumnHeaderDemo />
                  </DemoCard>
                  <DemoCard
                    title="Fixed Column Footer"
                    description="footer.content renders a fixed-height strip below the column's scrollable content area."
                    tags={["footer.content", "footer.resizable: false (default)"]}
                  >
                    <FixedColumnFooterDemo />
                  </DemoCard>
                  <DemoCard
                    title="Fixed Header + Footer"
                    description="Both header and footer as fixed strips with scrollable content in between — classic toolbar/statusbar pattern."
                    tags={["header.content", "footer.content"]}
                  >
                    <FixedHeaderAndFooterDemo />
                  </DemoCard>
                  <DemoCard
                    title="Toggle Section Visibility"
                    description="Both header and footer support show: boolean just like top-level columns."
                    tags={["header.show: boolean", "footer.show: boolean"]}
                  >
                    <HiddenSectionDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Column Sections — Resizable ── */}
              <section className="space-y-6">
                <SectionTitle title="Column Sections — Resizable (resizable: true)" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Resizable Column Header"
                    description="header.resizable: true makes the header a ResizablePanel with a vertical drag handle between it and the content."
                    tags={["header.resizable: true", "header.defaultSize: 35", "header.minSize: 15"]}
                  >
                    <ResizableColumnHeaderDemo />
                  </DemoCard>
                  <DemoCard
                    title="Resizable Column Footer"
                    description="footer.resizable: true — useful for detail panels below a list (master-detail layout within one column)."
                    tags={["footer.resizable: true", "footer.defaultSize: 35", "footer.minSize: 15"]}
                  >
                    <ResizableColumnFooterDemo />
                  </DemoCard>
                  <DemoCard
                    title="Resizable Header + Resizable Footer"
                    description="Both sections are resizable panels. Three independently-draggable vertical zones inside a single column."
                    tags={["header.resizable: true", "footer.resizable: true"]}
                  >
                    <ResizableHeaderAndFooterDemo />
                  </DemoCard>
                  <DemoCard
                    title="Mixed: Fixed Header + Resizable Footer"
                    description="Fixed toolbar header combined with a resizable detail footer — a common code-editor / IDE panel layout."
                    tags={["header.resizable: false", "footer.resizable: true", "footer.minSize: 15"]}
                  >
                    <MixedFixedResizableDemo />
                  </DemoCard>
                  <DemoCard
                    title="Collapsible Footer (Programmatic)"
                    description="Resizable footer with collapsible: true and a panelRef so the fixed header toolbar can collapse/expand it."
                    tags={["footer.collapsible: true", "footer.panelRef", "footer.onCollapse", "footer.onExpand"]}
                  >
                    <CollapsibleSectionDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Pagination ── */}
              <section className="space-y-6">
                <SectionTitle title="Pagination" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Offset Pagination"
                    description="totalItems known — shows first/last buttons, page X of Y, and an items-per-page selector."
                    tags={["totalItems", "onPageSizeChange", "pageSizeOptions"]}
                  >
                    <PaginationOffsetDemo />
                  </DemoCard>
                  <DemoCard
                    title="Cursor-Based Pagination"
                    description="Without totalItems — only prev/next buttons driven by hasNext and hasPrevious. Includes the items-per-page selector."
                    tags={["hasNext", "hasPrevious", "onPageSizeChange"]}
                  >
                    <PaginationCursorDemo />
                  </DemoCard>
                  <DemoCard
                    title="Without Items-Per-Page Selector"
                    description="Omit onPageSizeChange to hide the selector — useful when page size is fixed."
                    tags={["totalItems", "no onPageSizeChange"]}
                  >
                    <PaginationNoSelectorDemo />
                  </DemoCard>
                  <DemoCard
                    title="Narrow Column"
                    description="On small widths the three zones (selector, info, buttons) stack vertically thanks to flex-col on sm breakpoint."
                    tags={["responsive", "narrow column", "flex-col"]}
                  >
                    <PaginationNarrowDemo />
                  </DemoCard>
                </div>
              </section>

              {/* ── Direction ── */}
              <section className="space-y-6">
                <SectionTitle title="Direction" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DemoCard
                    title="Vertical Direction"
                    description="direction: 'vertical' stacks columns as rows with horizontal drag handles."
                    tags={["direction: 'vertical'", "columns × 3"]}
                  >
                    <VerticalDirectionDemo />
                  </DemoCard>
                  <DemoCard
                    title="Vertical Direction + Column Sections"
                    description="Column header/footer sections work in vertical layouts too — each row can have its own fixed strips."
                    tags={["direction: 'vertical'", "header.content", "footer.content"]}
                  >
                    <VerticalWithSectionsDemo />
                  </DemoCard>
                </div>
              </section>

            </div>
          ),
        },
      ]}
    />
  )
}
