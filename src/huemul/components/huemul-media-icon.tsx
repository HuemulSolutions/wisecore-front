import type { TFunction } from "i18next"
import { Image, FileText, File, Film, Music, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MediaLevel } from "@/types/media"

// ─── Image type helpers ─────────────────────────────────────────────────────────

export const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp"])
export const IMAGE_ACCEPT = Array.from(IMAGE_TYPES).join(",")

export function isImage(contentType?: string | null): boolean {
  return !!contentType && IMAGE_TYPES.has(contentType.toLowerCase())
}

// ─── Upload gate (accepted file types when creating/versioning media) ──────────

export const MEDIA_UPLOAD_EXTENSIONS = ["pdf", "docx", "xlsx", "png", "jpg", "csv", "pptx", "txt"] as const
export const MEDIA_UPLOAD_ACCEPT = MEDIA_UPLOAD_EXTENSIONS.map((ext) => `.${ext}`).join(",")

export function hasAllowedMediaExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return (MEDIA_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)
}

// Mapa best-effort extensión → mime, usado para decidir imagen vs. archivo y elegir
// ícono cuando no se conoce el content_type real (ej. valor ya persistido: el backend
// solo devuelve la URL firmada, sin metadatos del archivo), y como fuente única de
// los MIME exactos que usa el filtro de tipo de archivo (ver MEDIA_TYPE_FILTER_EXTENSIONS).
export const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  zip: "application/zip",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
}

// Extensiones filtrables por tipo — MEDIA_UPLOAD_EXTENSIONS menos "csv": su MIME
// varía entre navegador/SO (text/csv vs application/vnd.ms-excel) y el backend
// hace match exacto contra media_type, así que incluirlo filtraría mal. CSV sigue
// siendo subible, solo no aparece como opción del filtro.
export const MEDIA_TYPE_FILTER_EXTENSIONS = MEDIA_UPLOAD_EXTENSIONS.filter((ext) => ext !== "csv")

export function getMediaTypeOptions(t: TFunction): { value: string; label: string }[] {
  return MEDIA_TYPE_FILTER_EXTENSIONS.map((ext) => ({
    value: EXTENSION_MIME[ext],
    label: t(`filters.mediaTypes.${ext}`),
  }))
}

export function MediaIcon({ contentType, className }: { contentType?: string | null; className?: string }) {
  const cls = cn("shrink-0", className)
  if (!contentType) return <File className={cls} />
  if (isImage(contentType)) return <Image className={cn(cls, "text-blue-500")} />
  if (contentType.startsWith("video/")) return <Film className={cn(cls, "text-purple-500")} />
  if (contentType.startsWith("audio/")) return <Music className={cn(cls, "text-green-500")} />
  if (contentType.startsWith("text/") || contentType.includes("pdf")) return <FileText className={cn(cls, "text-orange-500")} />
  if (contentType.includes("zip") || contentType.includes("tar") || contentType.includes("gzip")) return <Archive className={cn(cls, "text-yellow-500")} />
  return <File className={cn(cls, "text-muted-foreground")} />
}

// ─── Level options ──────────────────────────────────────────────────────────────

export const LEVEL_VALUES = ["organization", "document_type", "document", "execution", "template"] as const

/**
 * Build the level select options with translated labels (media namespace).
 *
 * `allowed` restringe la lista: cada nivel distinto de "organization" hace que
 * el selector de padre pegue a un endpoint de OTRO recurso, así que quien no
 * tiene su permiso de listar no debe poder elegirlo (ver useMediaFilters).
 */
export function getLevelOptions(
  t: TFunction,
  allowed?: readonly MediaLevel[],
): { value: MediaLevel; label: string }[] {
  const values = allowed ? LEVEL_VALUES.filter((v) => allowed.includes(v)) : LEVEL_VALUES
  return values.map((value) => ({ value, label: t(`filters.levels.${value}`) }))
}
