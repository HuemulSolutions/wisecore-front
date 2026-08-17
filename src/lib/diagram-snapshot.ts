import type { RefObject } from "react"
import { toPng } from "html-to-image"
import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react"

// Fixed export canvas size used to frame the captured nodes (react-flow's official
// download-image recipe: https://reactflow.dev/examples/misc/download-image)
const SNAPSHOT_IMAGE_WIDTH = 1024
const SNAPSHOT_IMAGE_HEIGHT = 768

/**
 * Captures the current canvas as a PNG `File`, framed to the given nodes. Shared by
 * every save path that regenerates the diagram's snapshot (create, save changes) —
 * a metadata-only edit skips this entirely and reuses the existing snapshot.
 */
export async function captureDiagramSnapshot(
  containerRef: RefObject<HTMLDivElement | null>,
  nodes: Node[],
  fitView: () => void,
): Promise<File> {
  fitView()
  // Give React Flow a moment to settle the viewport before capturing.
  await new Promise((r) => setTimeout(r, 150))

  const viewportEl = containerRef.current?.querySelector<HTMLElement>('.react-flow__viewport')
  if (!viewportEl) throw new Error('Canvas not ready')

  // Frame just the nodes (excludes Controls/MiniMap/Panel and the side panels,
  // which live outside .react-flow__viewport) — same recipe as react-flow's docs.
  const bounds = getNodesBounds(nodes)
  const viewport = getViewportForBounds(
    bounds,
    SNAPSHOT_IMAGE_WIDTH,
    SNAPSHOT_IMAGE_HEIGHT,
    0.5,
    2,
    0.1,
  )

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: '#ffffff',
    width: SNAPSHOT_IMAGE_WIDTH,
    height: SNAPSHOT_IMAGE_HEIGHT,
    style: {
      width: `${SNAPSHOT_IMAGE_WIDTH}px`,
      height: `${SNAPSHOT_IMAGE_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  })
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], 'diagram-snapshot.png', { type: 'image/png' })
}
