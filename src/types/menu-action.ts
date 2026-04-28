import type { FileNode } from "@/types/assets"
import type { HuemulTreeMenuAction } from "@/types/huemul-tree"

/**
 * Assets-scoped menu action.
 * The `show` predicate receives a full FileNode so callers can inspect
 * domain-specific fields (e.g. access_levels, document_type).
 *
 * Re-exports HuemulTreeMenuAction for generic use cases.
 */
export type { HuemulTreeMenuAction }

export interface MenuAction extends Omit<HuemulTreeMenuAction, "show"> {
  show?: (node: FileNode) => boolean
}
