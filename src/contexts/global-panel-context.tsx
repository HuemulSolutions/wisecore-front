import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type {
  GlobalPanelSide,
  GlobalPanelState,
  GlobalPanelContextValue,
} from "@/types/global-panel-context"
export type { GlobalPanelSide, GlobalPanelState, GlobalPanelContextValue }

// ─── Context ──────────────────────────────────────────────────────────────────

const GlobalPanelContext = createContext<GlobalPanelContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_SIZE = 25
const MIN_SIZE = 15
const MAX_SIZE = 50

export function GlobalPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [side, setSideState] = useState<GlobalPanelSide>("right")
  const [content, setContentState] = useState<React.ReactNode | null>(null)
  const [title, setTitle] = useState("")
  const [raw, setRaw] = useState(false)
  const panelRef = useRef<ImperativePanelHandle | null>(null)

  const openPanel = useCallback(
    (opts?: { side?: GlobalPanelSide; content?: React.ReactNode; title?: string; raw?: boolean }) => {
      if (opts?.side) setSideState(opts.side)
      if (opts?.content !== undefined) setContentState(opts.content)
      if (opts?.title !== undefined) setTitle(opts.title)
      if (opts?.raw !== undefined) setRaw(opts.raw)
      setIsOpen(true)
    },
    [],
  )

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const togglePanel = useCallback(
    (opts?: { side?: GlobalPanelSide; content?: React.ReactNode; title?: string; raw?: boolean }) => {
      setIsOpen((prev) => {
        if (!prev) {
          if (opts?.side) setSideState(opts.side)
          if (opts?.content !== undefined) setContentState(opts.content)
          if (opts?.title !== undefined) setTitle(opts.title)
          if (opts?.raw !== undefined) setRaw(opts.raw)
        }
        return !prev
      })
    },
    [],
  )

  const setContent = useCallback((node: React.ReactNode, newTitle?: string) => {
    setContentState(node)
    if (newTitle !== undefined) setTitle(newTitle)
  }, [])

  const setSide = useCallback((s: GlobalPanelSide) => {
    setSideState(s)
  }, [])

  const value = useMemo<GlobalPanelContextValue>(
    () => ({
      isOpen,
      side,
      content,
      title,
      raw,
      defaultSize: DEFAULT_SIZE,
      minSize: MIN_SIZE,
      maxSize: MAX_SIZE,
      openPanel,
      closePanel,
      togglePanel,
      setContent,
      setSide,
      panelRef,
    }),
    [isOpen, side, content, title, raw, openPanel, closePanel, togglePanel, setContent, setSide],
  )

  return <GlobalPanelContext.Provider value={value}>{children}</GlobalPanelContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGlobalPanel(): GlobalPanelContextValue {
  const ctx = useContext(GlobalPanelContext)
  if (!ctx) throw new Error("useGlobalPanel must be used within a GlobalPanelProvider")
  return ctx
}
