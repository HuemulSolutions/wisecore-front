import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Sparkles, Download, AlertCircle, ImageOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useImageGenerationMutations } from "@/hooks/useImageGeneration"
import { getMediaDownloadUrl } from "@/services/media"
import { getErrorMessage } from "@/lib/error-utils"
import { HuemulSheet } from "./huemul-sheet"
import { HuemulField } from "./huemul-field"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { IMAGE_ASPECT_RATIOS, type ImageAspectRatio, type GeneratedImage } from "@/types/image-generation"

const RATIO_KEY: Record<ImageAspectRatio, string> = {
  "1:1": "square",
  "16:9": "landscape",
  "9:16": "portrait",
  "4:3": "standard",
  "3:4": "tall",
}

export interface HuemulMediaGenerateSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  /** Se dispara tras cada generación exitosa (para fijar la imagen en la galería). */
  onGenerated?: (image: GeneratedImage) => void
}

export function HuemulMediaGenerateSheet({
  open,
  onOpenChange,
  organizationId,
  onGenerated,
}: HuemulMediaGenerateSheetProps) {
  const { t } = useTranslation("media")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1")
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [selected, setSelected] = useState<GeneratedImage | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const openRef = useRef(open)
  const { generateImage } = useImageGenerationMutations(organizationId)
  const isPending = generateImage.isPending

  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    if (!isPending) return
    setElapsed(0)
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPending])

  function reset() {
    setPrompt("")
    setAspectRatio("1:1")
    setHistory([])
    setSelected(null)
    setPreviewUrl(null)
    setPreviewFailed(false)
    generateImage.reset()
  }

  async function handleGenerate() {
    const trimmed = prompt.trim()
    if (!trimmed) return
    const img = await generateImage.mutateAsync({ prompt: trimmed, aspect_ratio: aspectRatio })
    if (!openRef.current) return // el usuario cerró el sheet mientras generaba
    setHistory((prev) => [img, ...prev])
    setSelected(img)
    setPreviewUrl(img.url)
    setPreviewFailed(false)
    toast.success(t("generate.success"))
    onGenerated?.(img)
  }

  async function handlePreviewError() {
    if (!selected || previewFailed) return
    setPreviewFailed(true)
    try {
      const fresh = await getMediaDownloadUrl(organizationId, selected.media_id)
      setPreviewUrl(fresh)
      setPreviewFailed(false)
    } catch {
      // se mantiene el estado "enlace expirado"
    }
  }

  const previewAspectRatio = (selected?.aspect_ratio ?? aspectRatio).replace(":", " / ")

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}
      title={t("generate.title")}
      description={t("generate.description")}
      icon={Sparkles}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: history.length ? t("generate.regenerate") : t("generate.submit"),
        icon: Sparkles,
        onClick: handleGenerate,
        disabled: !prompt.trim(),
        closeOnSuccess: false,
      }}
      extraActions={
        selected && previewUrl
          ? [{
              label: t("generate.download"),
              icon: Download,
              position: "header" as const,
              closeOnSuccess: false,
              onClick: () => {
                const a = document.createElement("a")
                a.href = previewUrl
                a.download = selected.file_identifier
                a.target = "_blank"
                a.rel = "noopener noreferrer"
                a.click()
              },
            }]
          : []
      }
    >
      <div className="flex flex-col gap-4">
        <HuemulField
          type="textarea"
          label={t("generate.prompt")}
          value={prompt}
          onChange={(v) => setPrompt(String(v ?? ""))}
          placeholder={t("generate.promptPlaceholder")}
          helpText={t("generate.promptHelp")}
          rows={4}
          disabled={isPending}
          autoFocus
        />

        <HuemulField
          type="select"
          label={t("generate.aspectRatio")}
          value={aspectRatio}
          onChange={(v) => setAspectRatio(v as ImageAspectRatio)}
          disabled={isPending}
          options={IMAGE_ASPECT_RATIOS.map((ratio) => ({
            value: ratio,
            label: t(`generate.ratios.${RATIO_KEY[ratio]}`),
          }))}
        />

        {/* Preview */}
        <div
          className="rounded-lg border bg-muted flex items-center justify-center overflow-hidden mx-auto w-full max-h-80"
          style={{ aspectRatio: previewAspectRatio }}
        >
          {isPending ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
              <Skeleton className="absolute inset-0" />
              <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
              <p className="text-xs font-medium relative z-10">{t("generate.generating")}</p>
              <p className="text-xs text-muted-foreground relative z-10">
                {t("generate.elapsed", { seconds: elapsed })}
              </p>
              <p className="text-[11px] text-muted-foreground relative z-10">{t("generate.generatingHint")}</p>
            </div>
          ) : generateImage.isError ? (
            <div className="flex flex-col items-center gap-2 text-center px-4 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-xs">{getErrorMessage(generateImage.error, t("generate.error"))}</p>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={t("generate.previewAlt")}
              className="object-contain w-full h-full"
              onError={handlePreviewError}
            />
          ) : previewFailed ? (
            <div className="flex flex-col items-center gap-2 text-center px-4 text-muted-foreground">
              <ImageOff className="h-6 w-6" />
              <p className="text-xs">{t("generate.previewExpired")}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center px-4">{t("generate.emptyPreview")}</p>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("generate.history")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((img) => (
                <button
                  key={img.media_id}
                  type="button"
                  className={cn(
                    "shrink-0 h-14 w-14 rounded-md border overflow-hidden hover:cursor-pointer",
                    selected?.media_id === img.media_id && "ring-2 ring-primary",
                  )}
                  onClick={() => {
                    setSelected(img)
                    setPreviewUrl(img.url)
                    setPreviewFailed(false)
                  }}
                >
                  <img src={img.url} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t("generate.savedNote")}</p>
      </div>
    </HuemulSheet>
  )
}
