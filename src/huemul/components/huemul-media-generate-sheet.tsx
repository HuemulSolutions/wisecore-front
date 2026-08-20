import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Sparkles, Download, Trash2, AlertCircle, ImageOff, Image as ImageIcon, ImagePlus, RefreshCw, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { useImageGenerationMutations } from "@/hooks/useImageGeneration"
import { useMediaMutations } from "@/hooks/useMedia"
import { useImageLlms } from "@/hooks/useImageLlms"
import { getMediaDownloadUrl } from "@/services/media"
import { getErrorMessage, handleApiError, isErrorCode } from "@/lib/error-utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { HuemulSheet } from "./huemul-sheet"
import { HuemulField } from "./huemul-field"
import { HuemulButton } from "./huemul-button"
import { HuemulAspectRatioSelector } from "./huemul-aspect-ratio-selector"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  IMAGE_ASPECT_RATIOS,
  type ImageAspectRatio,
  type GeneratedImage,
  type GenerateImageRequest,
} from "@/types/image-generation"

/** Valor centinela del select de modelo: no se manda `llm_id` (elección del backend). */
const AUTO_LLM_VALUE = "auto"

const RATIO_KEY: Record<ImageAspectRatio, string> = {
  "1:1": "square",
  "16:9": "landscape",
  "9:16": "portrait",
  "4:3": "standard",
  "3:4": "tall",
}

const PROMPT_MAX_LENGTH = 400

export interface HuemulMediaGenerateSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  /**
   * `media:c`. `POST /image-generation/generate` persiste una Media real de la
   * organización y no hay recurso propio en PermissionResource, así que se
   * gatea con la escritura del recurso que produce. Obligatoria (sin default).
   */
  canCreate: boolean
  /** `media:d` — descartar una imagen generada llama a `DELETE /media/{id}` (o a borrar solo la versión). */
  canDelete: boolean
  /**
   * `llm:l|llm:r` — el selector de modelo lee `GET /llms/` (recurso ajeno al
   * sheet). Sin permiso el select no se renderiza y se genera con el modelo
   * automático del backend.
   */
  canListModels: boolean
  /**
   * Media existente a versionar, precargada desde el menú "Regenerar con IA"
   * de la galería. Cuando se define, el sheet abre con "Guardar como nueva
   * versión" activado y sin selector de historial de sesión propio.
   */
  initialVersionTarget?: { mediaId: string; name: string } | null
  /** Se dispara tras cada generación exitosa (para fijar la imagen en la galería). */
  onGenerated?: (image: GeneratedImage) => void
  /**
   * Se dispara tras descartar una imagen. `mediaDeleted` distingue si se borró
   * la Media completa (imagen sin versionar) o solo la versión descartada
   * (media con más versiones detrás): el padre solo debe desfijar el pin de
   * la galería en el primer caso.
   */
  onDiscarded?: (mediaId: string, mediaDeleted: boolean) => void
  /**
   * Cuando se define, el lienzo muestra un botón primario para insertar la
   * imagen seleccionada en el contexto que abrió el sheet (p.ej. referencia
   * de media del editor de documentos). El padre decide qué hacer con el
   * cierre del sheet tras insertar.
   */
  onInsert?: (image: GeneratedImage) => void
}

export function HuemulMediaGenerateSheet({
  open,
  onOpenChange,
  organizationId,
  canCreate,
  canDelete,
  canListModels,
  initialVersionTarget,
  onGenerated,
  onDiscarded,
  onInsert,
}: HuemulMediaGenerateSheetProps) {
  const { t } = useTranslation("media")
  const { t: tCommon } = useTranslation("common")
  const [prompt, setPrompt] = useState("")
  const [name, setName] = useState("")
  const [llmId, setLlmId] = useState<string>(AUTO_LLM_VALUE)
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1")
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [selected, setSelected] = useState<GeneratedImage | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const openRef = useRef(open)
  const { generateImage } = useImageGenerationMutations(organizationId)
  const { deleteMedia, deleteMediaVersion } = useMediaMutations(organizationId)
  const { data: imageLlms } = useImageLlms(open && canListModels)
  const isPending = generateImage.isPending

  useEffect(() => { openRef.current = open }, [open])

  // Al abrir con un destino precargado (menú "Regenerar con IA" de la
  // galería), arranca con "Guardar como nueva versión" activado.
  useEffect(() => {
    if (open && initialVersionTarget) setSaveAsNewVersion(true)
  }, [open, initialVersionTarget])

  const versionTarget = initialVersionTarget
    ?? (selected ? { mediaId: selected.media_id, name: name.trim() || t("generate.sessionImage") } : null)

  useEffect(() => {
    if (!isPending) return
    setElapsed(0)
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPending])

  function reset() {
    setPrompt("")
    setName("")
    setLlmId(AUTO_LLM_VALUE)
    setAspectRatio("1:1")
    setSaveAsNewVersion(false)
    setHistory([])
    setSelected(null)
    setPreviewUrl(null)
    setPreviewFailed(false)
    setElapsed(0)
    setIsFullscreen(false)
    generateImage.reset()
    deleteMedia.reset()
    deleteMediaVersion.reset()
  }

  function selectImage(img: GeneratedImage) {
    setSelected(img)
    setPreviewUrl(img.url)
    setPreviewFailed(false)
  }

  async function handleGenerate() {
    const trimmed = prompt.trim()
    if (!canCreate || !trimmed || isPending) return
    const body: GenerateImageRequest = {
      prompt: trimmed,
      aspect_ratio: aspectRatio,
      ...(llmId !== AUTO_LLM_VALUE && { llm_id: llmId }),
      ...(name.trim() && { name: name.trim() }),
      ...(saveAsNewVersion && versionTarget && {
        media_id: versionTarget.mediaId,
        save_as_new_version: true,
      }),
    }
    try {
      const img = await generateImage.mutateAsync(body)
      if (!openRef.current) return // el usuario cerró el sheet mientras generaba
      setHistory((prev) => [img, ...prev])
      selectImage(img)
      if (img.version_number && img.version_number > 1) {
        toast.success(t("generate.versionSuccess", { name: versionTarget?.name, version: img.version_number }))
      } else {
        toast.success(t("generate.success"))
      }
      onGenerated?.(img)
    } catch {
      // El error ya se muestra en el lienzo vía generateImage.isError.
      // Captura obligatoria: HuemulButton no propaga el catch al padre.
    }
  }

  async function handleDiscard() {
    if (!canDelete || !selected) return
    if (deleteMedia.isPending || deleteMediaVersion.isPending) return
    const { media_id: mediaId, version_number: versionNumber } = selected
    // Si la imagen es una versión (v2+) de una media con historia previa, solo
    // se borra esa versión; borrar la media entera se llevaría las anteriores.
    const isVersion = !!versionNumber && versionNumber > 1
    try {
      if (isVersion) {
        await deleteMediaVersion.mutateAsync({ mediaId, versionNumber })
      } else {
        await deleteMedia.mutateAsync(mediaId)
      }
    } catch (err) {
      handleApiError(err, { fallbackMessage: t("generate.discardError") })
      return
    }
    const rest = history.filter((img) => img.file_identifier !== selected.file_identifier)
    setHistory(rest)
    if (rest.length) {
      selectImage(rest[0])
    } else {
      setSelected(null)
      setPreviewUrl(null)
      setPreviewFailed(false)
    }
    onDiscarded?.(mediaId, !isVersion)
    toast.success(isVersion ? t("generate.discardVersionSuccess") : t("generate.discardSuccess"))
  }

  function handleDownload() {
    if (!selected || !previewUrl) return
    const a = document.createElement("a")
    a.href = previewUrl
    a.download = selected.file_identifier
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.click()
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

  const currentRatio = selected?.aspect_ratio ?? aspectRatio
  const [rw, rh] = currentRatio.split(":").map(Number)
  const canvasBoxStyle = {
    aspectRatio: `${rw} / ${rh}`,
    width: `min(100cqw, calc(100cqh * ${rw} / ${rh}))`,
  }

  function generateErrorMessage(err: unknown) {
    if (isErrorCode(err, "IMAGE_LLM_INVALID_CAPABILITY")) return t("generate.errors.invalidModel")
    if (isErrorCode(err, "MEDIA_NOT_IMAGE")) return t("generate.errors.notImage")
    if (isErrorCode(err, "LIFECYCLE_PERMISSION_DENIED")) return t("generate.errors.versionForbidden")
    return getErrorMessage(err, t("generate.error"))
  }

  if (!canCreate) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}
      title={t("generate.title")}
      icon={Sparkles}
      showFooter={false}
      maxWidth="sm:max-w-5xl"
      className="w-full sm:w-3/4"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0 lg:flex-row lg:overflow-hidden"
    >
      {/* ── Columna izquierda: controles ─────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col border-b lg:w-95 lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-6 px-6 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <HuemulField
            type="textarea"
            label={t("generate.prompt")}
            value={prompt}
            onChange={(v) => setPrompt(String(v ?? ""))}
            placeholder={t("generate.promptPlaceholder")}
            helpText={t("generate.promptHelp")}
            maxLength={PROMPT_MAX_LENGTH}
            showCharCount
            rows={6}
            inputClassName="min-h-32 max-h-64 resize-none"
            disabled={isPending}
            autoFocus
          />

          <HuemulField
            type="text"
            label={t("generate.name")}
            value={name}
            onChange={(v) => setName(String(v ?? ""))}
            placeholder={t("generate.namePlaceholder")}
            helpText={t("generate.nameHelp")}
            maxLength={120}
            disabled={isPending}
          />

          {canListModels && (
            <HuemulField
              type="select"
              label={t("generate.model")}
              value={llmId}
              onChange={(v) => setLlmId(String(v ?? AUTO_LLM_VALUE))}
              disabled={isPending}
              helpText={imageLlms?.length ? t("generate.modelHelp") : t("generate.modelEmpty")}
              options={[
                { value: AUTO_LLM_VALUE, label: t("generate.modelAuto") },
                ...(imageLlms ?? []).map((llm) => ({ value: llm.id, label: llm.name })),
              ]}
            />
          )}

          <HuemulAspectRatioSelector
            label={t("generate.format")}
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isPending}
            columns={3}
            options={IMAGE_ASPECT_RATIOS.map((ratio) => ({
              value: ratio,
              label: ratio,
              title: t(`generate.ratios.${RATIO_KEY[ratio]}`),
            }))}
          />

          {versionTarget && (
            <HuemulField
              type="switch"
              labelFirst
              label={t("generate.saveAsVersion", { name: versionTarget.name })}
              description={t("generate.saveAsVersionHelp")}
              value={saveAsNewVersion}
              onChange={(v) => setSaveAsNewVersion(Boolean(v))}
              disabled={isPending}
            />
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t bg-background px-6 py-4">
          <HuemulButton
            icon={Sparkles}
            label={history.length ? t("generate.regenerate") : t("generate.submit")}
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            loading={isPending}
            className="w-full"
          />
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            {t("generate.savedNote")}
          </p>
        </div>
      </aside>

      {/* ── Columna derecha: lienzo ───────────────────────────────── */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/40">
        <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 p-6 lg:min-h-0">
          <div className="flex min-h-0 w-full flex-1 items-center justify-center @container-size">
            {isPending ? (
              <div style={canvasBoxStyle} className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
                <Skeleton className="absolute inset-0 rounded-none" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                  <Loader2 className="size-7 animate-spin text-primary" />
                  <p className="text-sm font-medium">{t("generate.generating")}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t("generate.elapsed", { seconds: elapsed })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t("generate.generatingHint")}</p>
                </div>
              </div>
            ) : generateImage.isError ? (
              <div className="flex max-w-sm flex-col items-center gap-3 px-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="size-6 text-destructive" />
                </div>
                <p className="text-sm font-medium text-destructive">{t("generate.error")}</p>
                <p className="text-xs text-muted-foreground">
                  {generateErrorMessage(generateImage.error)}
                </p>
                <HuemulButton
                  size="sm"
                  variant="outline"
                  icon={RefreshCw}
                  label={tCommon("tryAgain")}
                  onClick={handleGenerate}
                />
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={t("generate.previewAlt")}
                role="button"
                aria-label={t("generate.expand")}
                className="max-h-full max-w-full cursor-zoom-in rounded-xl border bg-card object-contain shadow-sm transition-transform hover:scale-[1.01]"
                onError={handlePreviewError}
                onClick={() => setIsFullscreen(true)}
              />
            ) : previewFailed ? (
              <div className="flex flex-col items-center gap-3 px-8 text-center text-muted-foreground">
                <ImageOff className="size-6" />
                <p className="text-xs">{t("generate.previewExpired")}</p>
                <HuemulButton
                  size="sm"
                  variant="outline"
                  icon={RefreshCw}
                  label={t("generate.reloadPreview")}
                  onClick={handlePreviewError}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed bg-background/60">
                  <ImageIcon className="size-6 text-muted-foreground/70" />
                </div>
                <p className="text-sm text-muted-foreground">{t("generate.emptyPreview")}</p>
                <p className="text-xs text-muted-foreground/80">{t("generate.emptyHint")}</p>
              </div>
            )}
          </div>

          {selected && previewUrl && !isPending && (
            <div className="flex shrink-0 items-center justify-center gap-2">
              {onInsert && (
                <HuemulButton
                  size="sm"
                  icon={ImagePlus}
                  label={t("generate.insert")}
                  onClick={() => onInsert(selected)}
                />
              )}
              <HuemulButton
                variant="outline"
                size="sm"
                icon={Download}
                label={t("generate.download")}
                onClick={handleDownload}
              />
              {canDelete && (
                <HuemulButton
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  label={t("generate.discard")}
                  loading={deleteMedia.isPending || deleteMediaVersion.isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDiscard}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Franja "Esta sesión" ──────────────────────────────── */}
        {history.length > 0 && (
          <div className="shrink-0 border-t bg-background/70 px-6 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">{t("generate.session")}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t("generate.sessionCount", { count: history.length })}
              </p>
            </div>
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
              {history.map((img) => (
                <button
                  key={img.file_identifier}
                  type="button"
                  aria-pressed={selected?.file_identifier === img.file_identifier}
                  onClick={() => selectImage(img)}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted transition-colors hover:cursor-pointer hover:opacity-90",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    selected?.file_identifier === img.file_identifier
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border",
                  )}
                >
                  <img src={img.url} alt="" className="size-full object-cover" />
                  {!!img.version_number && img.version_number > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-mono text-white">
                      v{img.version_number}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {previewUrl && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent
            showCloseButton={false}
            className="top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
          >
            <DialogTitle className="sr-only">{t("generate.previewAlt")}</DialogTitle>
            <img
              src={previewUrl}
              alt={t("generate.previewAlt")}
              className="max-h-[95vh] max-w-[95vw] object-contain"
            />
            <button
              type="button"
              aria-label={tCommon("close")}
              onClick={() => setIsFullscreen(false)}
              className="fixed top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-opacity hover:opacity-80"
            >
              <X className="size-5" />
            </button>
          </DialogContent>
        </Dialog>
      )}
    </HuemulSheet>
  )
}
