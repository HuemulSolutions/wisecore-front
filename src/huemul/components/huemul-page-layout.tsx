import * as React from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type {
  HuemulColumnSection,
  HuemulPageLayoutColumn,
  HuemulPageLayoutProps,
} from "@/types/huemul"

export type { ImperativePanelHandle }
export type { HuemulColumnSection, HuemulPageLayoutColumn, HuemulPageLayoutProps }

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

// ─── Column-section helpers ───────────────────────────────────────────────────

/** Returns true if the column has at least one visible header or footer section. */
function hasColumnSections(col: HuemulPageLayoutColumn): boolean {
  return (
    (col.header != null && col.header.show !== false) ||
    (col.footer != null && col.footer.show !== false)
  )
}

/** Renders the inner content of a column, including optional header/footer sections. */
function renderColumnInner(
  col: HuemulPageLayoutColumn & { defaultSize: number },
  withHandle: boolean,
): React.ReactNode {
  const showHeader = col.header != null && col.header.show !== false
  const showFooter = col.footer != null && col.footer.show !== false

  if (!showHeader && !showFooter) {
    return col.content
  }

  const header = showHeader ? col.header! : null
  const footer = showFooter ? col.footer! : null
  const hasResizableHeader = header?.resizable === true
  const hasResizableFooter = footer?.resizable === true

  // ── All fixed (no resizable sections) ──────────────────────────────────────
  if (!hasResizableHeader && !hasResizableFooter) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {header && (
          <div className={cn("shrink-0", header.className)}>
            {header.content}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          {col.content}
        </div>
        {footer && (
          <div className={cn("shrink-0", footer.className)}>
            {footer.content}
          </div>
        )}
      </div>
    )
  }

  // ── At least one resizable section ─────────────────────────────────────────
  type SectionEntry = {
    key: string
    content: React.ReactNode
    sec: HuemulColumnSection | null
    rawSize: number | undefined
  }

  const entries: SectionEntry[] = []
  if (hasResizableHeader) entries.push({ key: "header", content: header!.content, sec: header!, rawSize: header!.defaultSize })
  entries.push({ key: "content", content: col.content, sec: null, rawSize: undefined })
  if (hasResizableFooter) entries.push({ key: "footer", content: footer!.content, sec: footer!, rawSize: footer!.defaultSize })

  // Normalise sizes within the panel group
  const specifiedTotal = entries.filter((e) => e.rawSize != null).reduce((s, e) => s + e.rawSize!, 0)
  const unspecifiedCount = entries.filter((e) => e.rawSize == null).length
  const eachUnspecified = unspecifiedCount > 0 ? Math.max(0, 100 - specifiedTotal) / unspecifiedCount : 0

  const panelGroup = (
    <ResizablePanelGroup direction="vertical" className="h-full">
      {entries.map((entry, i) => {
        const sec = entry.sec
        const defaultSize = entry.rawSize != null ? entry.rawSize : eachUnspecified
        return (
          <React.Fragment key={entry.key}>
            {i > 0 && <ResizableHandle withHandle={withHandle} />}
            <ResizablePanel
              ref={sec?.panelRef}
              defaultSize={defaultSize}
              minSize={sec?.minSize}
              maxSize={sec?.maxSize}
              collapsible={sec?.collapsible}
              collapsedSize={sec?.collapsedSize ?? (sec?.collapsible ? 0 : undefined)}
              onCollapse={sec?.onCollapse}
              onExpand={sec?.onExpand}
              className={cn("overflow-auto", sec?.className)}
            >
              {entry.content}
            </ResizablePanel>
          </React.Fragment>
        )
      })}
    </ResizablePanelGroup>
  )

  // Wrap in fixed strips if needed (mixed: some resizable, some fixed)
  const hasFixedHeader = header != null && !header.resizable
  const hasFixedFooter = footer != null && !footer.resizable

  if (!hasFixedHeader && !hasFixedFooter) {
    return panelGroup
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {hasFixedHeader && (
        <div className={cn("shrink-0", header!.className)}>
          {header!.content}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {panelGroup}
      </div>
      {hasFixedFooter && (
        <div className={cn("shrink-0", footer!.className)}>
          {footer!.content}
        </div>
      )}
    </div>
  )
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
  direction = "horizontal",
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
          <div className={cn(
            "h-full",
            hasColumnSections(normalizedColumns[0])
              ? "overflow-hidden"
              : "overflow-auto flex flex-col",
            normalizedColumns[0].className,
          )}>
            {renderColumnInner(normalizedColumns[0], withHandle)}
          </div>
        ) : (
          <ResizablePanelGroup direction={direction} className="h-full">
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
                  className={cn(
                    hasColumnSections(col)
                      ? "overflow-hidden"
                      : "overflow-auto",
                    col.className,
                  )}
                >
                  {renderColumnInner(col, withHandle)}
                </ResizablePanel>
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
