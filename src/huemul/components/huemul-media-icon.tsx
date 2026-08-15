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
