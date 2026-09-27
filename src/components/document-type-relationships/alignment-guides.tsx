"use client"

import { useViewport } from "@xyflow/react"

interface AlignmentGuidesProps {
  vertical: number[]
  horizontal: number[]
}

// Líneas guía de alineación (tipo Figma/draw.io) mostradas mientras se arrastra un
// nodo — no son nodos de React Flow, así que igual que `RoleColumnLabel` deben
// renderizarse como hijo directo de `<ReactFlow>` para que su `position: absolute`
// resuelva contra el mismo contenedor donde React Flow posiciona sus nodos, y
// replayan el pan/zoom del pane a mano vía `useViewport()`.
export function AlignmentGuides({ vertical, horizontal }: AlignmentGuidesProps) {
  const viewport = useViewport()

  return (
    <>
      {vertical.map((x) => (
        <div
          key={`v-${x}`}
          className="absolute top-0 h-full w-px pointer-events-none z-50"
          style={{
            transform: `translateX(${x * viewport.zoom + viewport.x}px)`,
            backgroundColor: "var(--brand)",
          }}
        />
      ))}
      {horizontal.map((y) => (
        <div
          key={`h-${y}`}
          className="absolute left-0 w-full h-px pointer-events-none z-50"
          style={{
            transform: `translateY(${y * viewport.zoom + viewport.y}px)`,
            backgroundColor: "var(--brand)",
          }}
        />
      ))}
    </>
  )
}
