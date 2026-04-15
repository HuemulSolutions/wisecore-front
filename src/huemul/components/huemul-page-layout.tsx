import * as React from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

export type { ImperativePanelHandle }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HuemulPageLayoutColumn {
  /** Content to render inside this column. */
  content: React.ReactNode
  /**
   * Initial size as a percentage (0–100).
   * Columns without an explicit size share the remaining space equally.
   */
  defaultSize?: number
  /** Minimum size constraint (percentage). */
  minSize?: number
  /** Maximum size constraint (percentage). */
  maxSize?: number
  /**
   * Controls column visibility.
   * Pass a boolean or any expression — falsy removes the column from the layout.
   * Defaults to `true`.
   */
  show?: boolean
  /**
   * When `true`, the panel can be dragged all the way to 0 (fully hidden).
   * Use together with `panelRef` to also collapse/expand programmatically.
   */
  collapsible?: boolean
  /**
   * Size (%) the panel snaps to when collapsed. Defaults to `0`.
   * Only relevant when `collapsible` is `true`.
   */
  collapsedSize?: number
  /** Called when the panel collapses to its `collapsedSize`. */
  onCollapse?: () => void
  /** Called when the panel expands from its `collapsedSize`. */
  onExpand?: () => void
  /**
   * Imperative ref to the underlying panel — lets you call
   * `ref.current.collapse()` / `ref.current.expand()` programmatically.
   */
  panelRef?: React.RefObject<ImperativePanelHandle | null>
  /**
   * Whether this column can be resized by dragging the adjacent handle.
   * When `false`, the resize handle next to this column is disabled.
   * Defaults to `true`.
   */
  resizable?: boolean
  /** Optional className forwarded to the ResizablePanel. */
  className?: string
}

export interface HuemulPageLayoutProps {
  /**
   * Full-width header rendered above the columns.
   * Only shown when both `header` is provided and `showHeader` is true.
   */
  header?: React.ReactNode
  /** Toggle header visibility. Defaults to `true`. */
  showHeader?: boolean
  /**
   * Column definitions (1–3 columns supported).
   * Use the `show` prop on each column to conditionally display it.
   */
  columns: HuemulPageLayoutColumn[]
  /** Extra className on the outer flex-col wrapper. */
  className?: string
  /** Extra className on the header strip. */
  headerClassName?: string
  /** Extra className on the columns area (below the header). */
  bodyClassName?: string
  /**
   * When `true`, a visible grip icon appears on every resize handle.
   * Defaults to `false`.
   */
  withHandle?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise `defaultSize` values so visible columns always sum to 100.
 * - Columns with no `defaultSize` share the remaining space equally.
 * - Columns whose explicit sizes don't sum to 100 are scaled proportionally.
 */
function normalise(visible: HuemulPageLayoutColumn[]): (HuemulPageLayoutColumn & { defaultSize: number })[] {
  if (visible.length === 0) return []

  const specified = visible.filter((c) => c.defaultSize != null)
  const unspecified = visible.filter((c) => c.defaultSize == null)

  // All equal
  if (specified.length === 0) {
    const size = 100 / visible.length
    return visible.map((c) => ({ ...c, defaultSize: size }))
  }

  // All specified — scale to 100
  if (unspecified.length === 0) {
    const total = specified.reduce((s, c) => s + (c.defaultSize ?? 0), 0)
    const factor = total > 0 ? 100 / total : 1
    return visible.map((c) => ({ ...c, defaultSize: (c.defaultSize ?? 0) * factor }))
  }

  // Mix: give unspecified columns equal shares of remaining space
  const specifiedTotal = specified.reduce((s, c) => s + (c.defaultSize ?? 0), 0)
  const remaining = Math.max(0, 100 - specifiedTotal)
  const each = remaining / unspecified.length
  return visible.map((c) => (c.defaultSize != null ? { ...c, defaultSize: c.defaultSize } : { ...c, defaultSize: each }))
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `HuemulPageLayout` — flexible page layout with an optional full-width header
 * and 1–3 horizontally-resizable columns.
 *
 * @example 2-column layout with header
 * ```tsx
 * <HuemulPageLayout
 *   header={<MyHeader />}
 *   columns={[
 *     { content: <Sidebar />, defaultSize: 20, minSize: 15 },
 *     { content: <MainContent /> },
 *   ]}
 * />
 * ```
 *
 * @example Toggle right panel based on selection
 * ```tsx
 * <HuemulPageLayout
 *   columns={[
 *     { content: <List onSelect={setSelected} /> },
 *     { content: <Detail item={selected} />, defaultSize: 40, show: selected != null },
 *   ]}
 * />
 * ```
 */
export function HuemulPageLayout({
  header,
  showHeader = true,
  columns,
  className,
  headerClassName,
  bodyClassName,
  withHandle = false,
}: HuemulPageLayoutProps) {
  const normalizedColumns = React.useMemo(
    () => normalise(columns.filter((c) => c.show !== false)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  )

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Optional full-width header */}
      {showHeader && header != null && (
        <div className={cn("w-full shrink-0 border-b bg-background", headerClassName)}>
          {header}
        </div>
      )}

      {/* Columns area */}
      <div className={cn("flex-1 min-h-0 overflow-hidden", bodyClassName)}>
        {normalizedColumns.length === 0 ? null : normalizedColumns.length === 1 ? (
          /* Single column — no resizable overhead */
          <div className={cn("h-full overflow-auto", normalizedColumns[0].className)}>
            {normalizedColumns[0].content}
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {normalizedColumns.map((col, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ResizableHandle
                    withHandle={withHandle}
                    disabled={
                      normalizedColumns[index - 1].resizable === false ||
                      col.resizable === false
                    }
                  />
                )}
                <ResizablePanel
                  ref={col.panelRef}
                  defaultSize={col.defaultSize}
                  minSize={col.minSize}
                  maxSize={col.maxSize}
                  collapsible={col.collapsible}
                  collapsedSize={col.collapsedSize ?? (col.collapsible ? 0 : undefined)}
                  onCollapse={col.onCollapse}
                  onExpand={col.onExpand}
                  className={cn("overflow-auto", col.className)}
                >
                  {col.content}
                </ResizablePanel>
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
