"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Trash2, UserCog, UserX } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { CanvasElementNodeData } from "./text-node"

interface ElementPanelProps {
  elementData: CanvasElementNodeData
  onClose: () => void
  readOnly?: boolean
}

// Editing panel for free-standing text/container/role elements — mirrors NodePanel's
// layout so the right-side panel stays visually consistent across selection types.
export function ElementPanel({ elementData, onClose, readOnly = false }: ElementPanelProps) {
  const { t } = useTranslation("document-type-relationships")
  const isContainer = elementData.kind === "container"
  const isRole = elementData.kind === "role"

  const [content, setContent] = useState(elementData.content)
  useEffect(() => setContent(elementData.content), [elementData.content])

  const handleContentChange = (value: string) => {
    setContent(value)
    // Backend rejects blank content — don't propagate a blank draft to the node;
    // it keeps showing the last valid value until the user types something real.
    if (value.trim()) elementData.onContentChange?.(elementData.id, value)
  }

  return (
    <div className="w-72 shrink-0 flex flex-col border-l bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-3.5 w-3.5 rounded-full shrink-0"
            style={{ backgroundColor: elementData.color || "#94a3b8" }}
          />
          <span className="text-sm font-semibold truncate">
            {isContainer ? t("elementPanel.containerTitle") : isRole ? t("elementPanel.roleTitle") : t("elementPanel.textTitle")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4 flex-1 overflow-auto">
        {!isRole && (
          <HuemulField
            type="textarea"
            label={isContainer ? t("elementPanel.title") : t("elementPanel.content")}
            name="element_content"
            value={content}
            onChange={(v) => handleContentChange(String(v))}
            required
            disabled={readOnly}
          />
        )}

        <HuemulField
          type="color"
          label={isContainer ? t("elementPanel.borderColor") : isRole ? t("elementPanel.color") : t("elementPanel.textColor")}
          name="element_color"
          value={elementData.color}
          onChange={(v) => elementData.onColorChange?.(elementData.id, String(v))}
          disabled={readOnly || isRole}
        />

        {/* Role assignment — containers can optionally act as a lane; a role node's
            label always mirrors its assigned role (roles have no color of their own). */}
        {(isContainer || isRole) && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t("elementPanel.role")}
            </p>
            {/* Roles have no assignable color or other per-role visual attribute (no
                such field on the role form) — plain text, no marker in front. */}
            <span className="text-sm truncate block">
              {elementData.role?.name ?? t("elementPanel.noRole")}
            </span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => elementData.onRequestRolePick?.(elementData.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs text-muted-foreground flex-1 hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors"
                >
                  <UserCog className="h-3.5 w-3.5 shrink-0" />
                  <span>{elementData.role ? t("elementPanel.changeRole") : t("elementPanel.selectRole")}</span>
                </button>
                {isContainer && elementData.role && (
                  <button
                    onClick={() => elementData.onClearRole?.(elementData.id)}
                    className="p-1.5 rounded-md border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:cursor-pointer transition-colors"
                    title={t("elementPanel.clearRole")}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!readOnly && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t("nodePanel.actions")}
            </p>
            <button
              onClick={() => { elementData.onRemove?.(elementData.id); onClose() }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground w-full hover:bg-destructive/10 hover:text-destructive hover:cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t("node.removeFromCanvas")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
