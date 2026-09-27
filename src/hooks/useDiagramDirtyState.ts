import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { buildCanvasSignature, type CanvasNode } from "@/lib/diagram-utils"
import type { Edge } from "@xyflow/react"
import type { RelationshipEdgeData } from "@/components/document-type-relationships/relationship-edge"
import type { UseDiagramDirtyStateOptions, DiagramDirtyState } from "@/types/document-type-relationships"

/**
 * Tracking real de "cambios sin guardar" para el canvas de diagramas. Compara la
 * firma serializada del grafo actual (`buildCanvasSignature`) contra la línea base
 * del último grafo cargado/guardado — no un contador de eventos, así que deshacer
 * un cambio (agregar y borrar el mismo nodo) vuelve a marcar "limpio".
 *
 * El sembrado de un diagrama llega en varias olas (nodos → medición de react-flow
 * → flush de aristas pendientes vía `useNodesInitialized`); estampar la línea base
 * en cualquiera de esas olas intermedias marcaría dirty apenas termine de sembrar.
 * `isSeedPending` corta mientras haya un lote en vuelo, y el debounce de 0ms
 * estampa recién cuando el grafo queda quieto un macrotask.
 */
export function useDiagramDirtyState({ nodes, edges, isSeedPending }: UseDiagramDirtyStateOptions): DiagramDirtyState {
  const signature = useMemo(() => buildCanvasSignature(nodes, edges), [nodes, edges])
  const signatureRef = useRef(signature)
  signatureRef.current = signature

  const baselineRef = useRef<string | null>(null)
  const needsBaselineRef = useRef(true) // al montar todavía no hay línea base
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!needsBaselineRef.current) {
      setIsDirty(signature !== baselineRef.current)
      return
    }
    if (isSeedPending()) return
    const id = window.setTimeout(() => {
      needsBaselineRef.current = false
      baselineRef.current = signatureRef.current
      setIsDirty(false)
    }, 0)
    return () => window.clearTimeout(id)
  }, [signature, isSeedPending])

  const requestBaselineReset = useCallback(() => {
    needsBaselineRef.current = true
  }, [])

  const markSaved = useCallback((savedNodes: CanvasNode[], savedEdges: Edge<RelationshipEdgeData>[]) => {
    needsBaselineRef.current = false
    baselineRef.current = buildCanvasSignature(savedNodes, savedEdges)
    // El usuario pudo mover algo mientras el PUT/POST viajaba: comparar contra la
    // firma actual, no asumir "limpio" a ciegas.
    setIsDirty(signatureRef.current !== baselineRef.current)
  }, [])

  return { isDirty, requestBaselineReset, markSaved }
}
