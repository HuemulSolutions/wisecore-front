import type { TMentionElement } from 'platejs';

/** `refType` ausente ⇒ 'asset' (menciones creadas antes de soportar roles). */
export type MentionRefType = 'asset' | 'role';

/** Mention element referencing an asset or a role: `value`/`key` hold the
 * name/id of the referenced entity, `color` snapshots its color at
 * insertion time (asset type color, or role color) — usado solo como
 * fallback antes de que `MentionRefsProvider` resuelva datos frescos.
 * `executionId` is set only for asset mentions pinned to a specific version. */
export type WisecoreMentionElement = TMentionElement & {
  /** Id del asset (documentId) o del rol referenciado — nombrado `key` por el propio nodo de Plate. */
  key: string;
  color?: string | null;
  executionId?: string | null;
  refType?: MentionRefType;
};
