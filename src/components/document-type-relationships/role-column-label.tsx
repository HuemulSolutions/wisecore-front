"use client"

import { useViewport } from "@xyflow/react"

interface RoleColumnLabelProps {
  x: number
  y: number
  label: string
}

// Decorative "ROLES" eyebrow above the role column — not a React Flow node, so it
// never gets persisted or counted as canvas content. Manually replays the pane's
// pan/zoom transform (`useViewport`) to stay pinned above the topmost role pill;
// must be rendered as a direct child of `<ReactFlow>` so its `position: absolute`
// resolves against the same container React Flow positions its own nodes in.
export function RoleColumnLabel({ x, y, label }: RoleColumnLabelProps) {
  const viewport = useViewport()

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.09em]"
      style={{
        transform: `translate(${x * viewport.zoom + viewport.x}px, ${y * viewport.zoom + viewport.y}px)`,
        color: "var(--diagram-container-label)",
      }}
    >
      {label}
    </div>
  )
}
