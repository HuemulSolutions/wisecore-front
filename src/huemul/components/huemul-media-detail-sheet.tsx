import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Image, Pencil, Plus, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatAbsoluteDate } from "@/lib/format-relative-time"

import { useMediaVersions, useMediaMutations } from "@/hooks/useMedia"
import { handleApiError } from "@/lib/error-utils"
import { HuemulSheet } from "./huemul-sheet"
import { HuemulAlertDialog } from "./huemul-alert-dialog"
import { HuemulInfoDisplay, HuemulInfoGroup, HuemulInfoItem } from "./huemul-info-display"
import { HuemulField } from "./huemul-field"
import { HuemulButton } from "./huemul-button"
import { MediaPreviewPane } from "./huemul-media-preview-pane"
import { MediaVersionRow, downloadVersion } from "./huemul-media-version-row"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatBytes } from "@/lib/format-bytes"
import { IMAGE_TYPES, IMAGE_ACCEPT } from "./huemul-media-icon"
import type { Media, MediaVersion } from "@/types/media"

// ─── Media detail sheet ───────────────────────────────────────────────────────

export interface HuemulMediaDetailSheetProps {
  item: Media | null
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  /**
   * Los tres flags son obligatorios a propósito (sin default): un default en
   * `true` es indistinguible de "todavía no lo gatearon", y así cualquier
   * call-site nuevo rompe el build en vez de reabrir el hueco en silencio.
   * Ver punto 9 de ia context/rbac-audit-guide.md.
   */
  canCreate: boolean // media:c — subir una versión nueva
  canUpdate: boolean // media:u — editar nombre/descripción
  canDelete: boolean // media:d — borrar la media y sus versiones
}

export function HuemulMediaDetailSheet({
  item,
  open,
  onOpenChange,
  organizationId,
  canCreate,
  canUpdate,
  canDelete,
}: HuemulMediaDetailSheetProps) {
  const { t } = useTranslation("media")
  const { t: tCommon } = useTranslation("common")
  const [deleteMediaOpen, setDeleteMediaOpen] = useState(false)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<MediaVersion | null>(null)
  const versionFileInputRef = useRef<HTMLInputElement>(null)

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editName, setEditName] = useState("")
  const [editSummary, setEditSummary] = useState("")
  const [nameOverride, setNameOverride] = useState<string | null>(null)
  const [summaryOverride, setSummaryOverride] = useState<string | null>(null)

  const { deleteMedia, patchMedia, uploadMediaVersion, deleteMediaVersion } = useMediaMutations(organizationId)

  const {
    data: versionsData,
    isLoading: versionsLoading,
    isFetching: versionsFetching,
    refetch: refetchVersions,
  } = useMediaVersions(
    organizationId,
    item?.id ?? "",
    { enabled: open && !!item },
  )

  useEffect(() => {
    setIsEditingInfo(false)
    setNameOverride(null)
    setSummaryOverride(null)
    setDeleteVersionTarget(null)
  }, [item?.id])

  // `placeholderData` puede devolver momentáneamente las versiones del item
  // anterior mientras cambia la query key: se filtra por seguridad.
  const versions = useMemo(
    () => (versionsData?.data ?? [])
      .filter((v) => v.media_id === item?.id)
      .sort((a, b) => b.version_number - a.version_number),
    [versionsData, item?.id],
  )

  // `item.current_version` es un snapshot que el padre no refresca tras subir
  // una versión nueva: se deriva la actual desde `useMediaVersions`.
  const currentVersion = versions.find((v) => v.is_current) ?? versions[0] ?? item?.current_version ?? null
  const nextVersionNumber = (versions[0]?.version_number ?? 0) + 1

  const displayedName = nameOverride ?? item?.name ?? null
  const displayedSummary = summaryOverride ?? item?.summary ?? null
  const name = displayedName ?? currentVersion?.original_filename ?? item?.id ?? ""
  const contentType = currentVersion?.content_type
  const headerSubtitle = [contentType, formatBytes(currentVersion?.file_size)]
    .filter(Boolean)
    .join(" · ")

  const showVersionsSkeleton = versionsLoading || uploadMediaVersion.isPending ||
    (versionsFetching && versions.length === 0)

  function handleStartEdit() {
    setEditName(displayedName ?? "")
    setEditSummary(displayedSummary ?? "")
    setIsEditingInfo(true)
  }

  function handleCancelEdit() {
    setIsEditingInfo(false)
  }

  async function handleSaveEdit() {
    if (!item || !canUpdate) return
    try {
      const updated = await patchMedia.mutateAsync({
        mediaId: item.id,
        body: { name: editName.trim(), summary: editSummary.trim() },
      })
      setNameOverride(updated.name)
      setSummaryOverride(updated.summary)
      toast.success(t("detail.editSuccess"))
      setIsEditingInfo(false)
    } catch (err) {
      handleApiError(err, { fallbackMessage: t("detail.editError") })
    }
  }

  async function uploadVersionFile(file: File) {
    if (!item || !canCreate || uploadMediaVersion.isPending) return
    if (!IMAGE_TYPES.has(file.type.toLowerCase())) {
      toast.error(t("upload.invalidImageType", { formats: "PNG, JPG, GIF, BMP" }))
      return
    }
    try {
      await uploadMediaVersion.mutateAsync({ mediaId: item.id, body: { file } })
      toast.success(t("detail.uploadVersionSuccess"))
    } catch (err) {
      handleApiError(err, { fallbackMessage: t("detail.uploadVersionError") })
    }
  }

  function handleVersionInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadVersionFile(file)
    if (versionFileInputRef.current) versionFileInputRef.current.value = ""
  }

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={name}
        description={headerSubtitle}
        icon={Image}
        maxWidth="sm:max-w-5xl"
        className="w-full sm:w-3/4"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0 lg:flex-row lg:overflow-hidden"
        showFooter={false}
      >
        {item && (
          <>
            {/* ── Columna izquierda: lienzo ─────────────────────────── */}
            <MediaPreviewPane
              key={item.id}
              version={currentVersion}
              name={name}
              nextVersionNumber={nextVersionNumber}
              uploading={uploadMediaVersion.isPending}
              sheetOpen={open}
              canUpload={canCreate}
              onDownload={() => downloadVersion(currentVersion)}
              onPickFile={() => versionFileInputRef.current?.click()}
              onFileDropped={uploadVersionFile}
            />

            {/* ── Columna derecha: detalles + versiones ─────────────── */}
            <aside className="flex w-full shrink-0 flex-col border-t lg:w-95 lg:min-h-0 lg:border-t-0 lg:border-l">
              <div className="flex flex-col gap-6 px-5 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">

                {/* ── Detalles ─────────────────────────────────────── */}
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      {t("detail.details")}
                    </p>
                    <Separator className="flex-1" />
                    {canUpdate && !isEditingInfo && (
                      <HuemulButton
                        variant="link"
                        size="sm"
                        className="h-auto shrink-0 p-0 text-xs hover:cursor-pointer"
                        icon={Pencil}
                        label={t("detail.edit")}
                        onClick={handleStartEdit}
                      />
                    )}
                  </div>

                  {canUpdate && isEditingInfo ? (
                    <div className="flex flex-col gap-4">
                      <HuemulField
                        type="text"
                        label={t("detail.name")}
                        value={editName}
                        onChange={(value) => setEditName(String(value ?? ""))}
                        disabled={patchMedia.isPending}
                      />
                      <HuemulField
                        type="textarea"
                        label={t("detail.description")}
                        value={editSummary}
                        onChange={(value) => setEditSummary(String(value ?? ""))}
                        placeholder={t("detail.descriptionPlaceholder")}
                        maxLength={280}
                        showCharCount
                        rows={4}
                        inputClassName="min-h-24 max-h-48 resize-none"
                        disabled={patchMedia.isPending}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs hover:cursor-pointer"
                          onClick={handleCancelEdit}
                          disabled={patchMedia.isPending}
                        >
                          {tCommon("cancel")}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs hover:cursor-pointer"
                          onClick={handleSaveEdit}
                          disabled={patchMedia.isPending}
                        >
                          {patchMedia.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                          {tCommon("save")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <HuemulInfoDisplay>
                      <HuemulInfoGroup>
                        <HuemulInfoItem label={t("detail.name")} value={displayedName} />
                        <HuemulInfoItem label={t("detail.description")} value={displayedSummary} />
                      </HuemulInfoGroup>
                      <HuemulInfoGroup layout="grid-2">
                        <HuemulInfoItem label={t("detail.origin")} value={item.origin} />
                        <HuemulInfoItem
                          label={t("detail.createdAt")}
                          value={item.created_at ? formatAbsoluteDate(item.created_at) : undefined}
                        />
                      </HuemulInfoGroup>
                    </HuemulInfoDisplay>
                  )}
                </section>

                {/* ── Versiones ────────────────────────────────────── */}
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      {t("detail.versions")}
                    </p>
                    {versions.length > 0 && (
                      <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px] tabular-nums">
                        {versions.length}
                      </Badge>
                    )}
                    <Separator className="flex-1" />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:cursor-pointer"
                      icon={RefreshCw}
                      tooltip={tCommon("refresh")}
                      loading={versionsFetching}
                      onClick={() => refetchVersions()}
                    />
                    {canCreate && (
                      <>
                        <HuemulButton
                          variant="outline"
                          size="sm"
                          className="h-6 shrink-0 px-2 text-xs hover:cursor-pointer"
                          icon={Plus}
                          label={t("detail.uploadShort")}
                          loading={uploadMediaVersion.isPending}
                          onClick={() => versionFileInputRef.current?.click()}
                        />
                        <input
                          ref={versionFileInputRef}
                          type="file"
                          accept={IMAGE_ACCEPT}
                          className="sr-only"
                          onChange={handleVersionInputChange}
                        />
                      </>
                    )}
                  </div>

                  {showVersionsSkeleton ? (
                    <div className="flex flex-col gap-1.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-13 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">{t("detail.noVersions")}</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {versions.map((v) => (
                        <MediaVersionRow
                          key={v.id}
                          version={v}
                          isCurrent={v.id === currentVersion?.id}
                          onDelete={canDelete ? () => setDeleteVersionTarget(v) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* ── Danger zone ──────────────────────────────────────── */}
              {canDelete && (
                <div className="shrink-0 border-t bg-background px-5 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                    onClick={() => setDeleteMediaOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {t("detail.deleteMedia")}
                  </Button>
                </div>
              )}
            </aside>
          </>
        )}
      </HuemulSheet>

      {/* Delete media confirmation */}
      <HuemulAlertDialog
        open={deleteMediaOpen}
        onOpenChange={setDeleteMediaOpen}
        title={t("detail.deleteMediaTitle")}
        description={t("detail.deleteMediaDescription")}
        actionLabel={t("detail.deleteMediaConfirm")}
        onAction={async () => {
          if (!canDelete || !item) return
          await deleteMedia.mutateAsync(item.id)
          toast.success(t("detail.deleteMediaSuccess"))
          onOpenChange(false)
        }}
      />

      {/* Delete version confirmation */}
      <HuemulAlertDialog
        open={!!deleteVersionTarget}
        onOpenChange={(v) => { if (!v) setDeleteVersionTarget(null) }}
        title={t("detail.deleteVersionTitle")}
        description={t("detail.deleteVersionDescription", { version: deleteVersionTarget?.version_number })}
        actionLabel={t("detail.deleteVersionConfirm")}
        onAction={async () => {
          if (!canDelete || !item || !deleteVersionTarget) return
          await deleteMediaVersion.mutateAsync({
            mediaId: item.id,
            versionNumber: deleteVersionTarget.version_number,
          })
          toast.success(t("detail.deleteVersionSuccess"))
          setDeleteVersionTarget(null)
        }}
      />
    </>
  )
}
