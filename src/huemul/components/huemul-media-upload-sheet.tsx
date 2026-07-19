import { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { useMediaMutations } from "@/hooks/useMedia"
import { HuemulSheet } from "./huemul-sheet"
import { HuemulField } from "./huemul-field"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/format-bytes"
import { IMAGE_TYPES, IMAGE_ACCEPT, MediaIcon, getLevelOptions } from "./huemul-media-icon"
import { HuemulMediaParentField, getMediaParentLabel } from "./huemul-media-parent"
import { HuemulAssetTreePickerField } from "./huemul-asset-tree-picker"
import type { MediaLevel } from "@/types/media"

export interface HuemulMediaUploadSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  /**
   * When provided, the sheet uploads at this fixed level (with optional parent)
   * and hides the level select. When omitted, the user picks the level.
   */
  fixedLevel?: { level: MediaLevel; parentId?: string | null }
  onUploaded?: () => void
}

export function HuemulMediaUploadSheet({
  open,
  onOpenChange,
  organizationId,
  fixedLevel,
  onUploaded,
}: HuemulMediaUploadSheetProps) {
  const { t } = useTranslation("media")
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<MediaLevel>(fixedLevel?.level ?? "organization")
  const [parentId, setParentId] = useState<string | null>(fixedLevel?.parentId ?? null)
  const [parentLabel, setParentLabel] = useState<string>()
  const [name, setName] = useState("")
  const [summary, setSummary] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadMedia } = useMediaMutations(organizationId)

  // Whether the user must pick a parent entity (non-org level chosen via the dropdown).
  const needsParent = !fixedLevel && level !== "organization"
  // Asset/execution levels use the folder-tree picker; the rest use the async combobox.
  const useTreePicker = needsParent && (level === "document" || level === "execution")

  function reset() {
    setFile(null)
    setName("")
    setSummary("")
    setLevel(fixedLevel?.level ?? "organization")
    setParentId(fixedLevel?.parentId ?? null)
    setParentLabel(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    if (!file) throw new Error("No file selected")
    await uploadMedia.mutateAsync({
      file,
      level: fixedLevel?.level ?? level,
      parent_id: fixedLevel?.parentId ?? (level !== "organization" ? parentId : null),
      name: name.trim() || null,
      summary: summary.trim() || null,
    })
    toast.success(t("upload.success"))
    reset()
    onUploaded?.()
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}
      title={t("upload.title")}
      icon={Upload}
      saveAction={{ label: t("upload.submit"), onClick: handleSave, disabled: !file || (needsParent && !parentId) }}
    >
      <div className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:cursor-pointer hover:bg-muted/50",
            file ? "border-primary/40 bg-primary/5" : "border-muted-foreground/25",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (f.type.startsWith("image/") && !IMAGE_TYPES.has(f.type.toLowerCase())) {
                toast.error(t("upload.invalidImageType", { formats: "PNG, JPG, GIF, BMP" }))
                if (fileInputRef.current) fileInputRef.current.value = ""
                return
              }
              setFile(f)
              if (!name) setName(f.name)
            }}
          />
          {file ? (
            <>
              <MediaIcon contentType={file.type} className="h-8 w-8" />
              <p className="text-sm font-medium truncate max-w-full px-4">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
              >
                {t("upload.changeFile")}
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t("upload.dropzone")}</p>
              <p className="text-xs text-muted-foreground">{t("upload.dropzoneHint")}</p>
            </>
          )}
        </div>

        {!fixedLevel && (
          <HuemulField
            type="select"
            label={t("filters.level")}
            value={level}
            onChange={(v) => {
              setLevel(v as MediaLevel)
              setParentId(null)
              setParentLabel(undefined)
            }}
            options={getLevelOptions(t)}
          />
        )}
        {useTreePicker ? (
          <HuemulAssetTreePickerField
            mode={level === "execution" ? "execution" : "document"}
            organizationId={organizationId}
            valueId={parentId ?? undefined}
            valueLabel={parentLabel}
            label={getMediaParentLabel(t, level)}
            placeholder={t("filters.parentPlaceholder")}
            onPick={(id, label) => { setParentId(id || null); setParentLabel(label) }}
            onClear={() => { setParentId(null); setParentLabel(undefined) }}
          />
        ) : needsParent ? (
          <HuemulMediaParentField
            level={level}
            organizationId={organizationId}
            value={parentId ?? ""}
            onValueChange={(v) => setParentId(v || null)}
            label={getMediaParentLabel(t, level)}
            placeholder={t("filters.parentPlaceholder")}
          />
        ) : null}
        <HuemulField
          type="text"
          label={t("upload.name")}
          value={name}
          onChange={(v) => setName(String(v ?? ""))}
          placeholder={t("upload.namePlaceholder")}
        />
        <HuemulField
          type="text"
          label={t("upload.summary")}
          value={summary}
          onChange={(v) => setSummary(String(v ?? ""))}
          placeholder={t("upload.summaryPlaceholder")}
        />
      </div>
    </HuemulSheet>
  )
}
