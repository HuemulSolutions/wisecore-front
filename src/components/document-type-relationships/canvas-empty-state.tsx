"use client"

import { useTranslation } from "react-i18next"
import { Panel } from "@xyflow/react"
import { GitMerge } from "lucide-react"
import { cn } from "@/lib/utils"

/** Placeholder centrado mostrado mientras el canvas no tiene ningún nodo. */
export function CanvasEmptyState({ mode }: { mode: "document-type" | "execution" }) {
  const { t } = useTranslation("document-type-relationships")

  return (
    <Panel position="top-center">
      <div
        className={cn(
          "mt-20 flex flex-col items-center gap-3 p-8",
          "bg-background/80 backdrop-blur rounded-xl border border-dashed",
          "text-center pointer-events-none",
        )}
      >
        <GitMerge className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t(mode === "execution" ? "canvas.emptyExecution" : "canvas.empty")}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {t(mode === "execution" ? "canvas.connectHintExecution" : "canvas.connectHint")}
        </p>
      </div>
    </Panel>
  )
}
