import type {
  CollectionAccessGrant,
  CollectionPrincipal,
  UpdateCollectionAccessRequest,
} from "@/types/collections"

/** `role:<id>` o `user:<id>`: identifica a un principal en el borrador y en lo guardado. */
export const principalKey = (principal: CollectionPrincipal) =>
  principal.role_id ? `role:${principal.role_id}` : `user:${principal.user_id}`

/**
 * Cambios explícitos entre lo guardado y el borrador: `add` = nuevos o con otro nivel,
 * `remove` = los que ya no están. Nunca la lista completa: lo que no cambió no viaja.
 */
export function diffCollectionAccess(
  saved: CollectionAccessGrant[],
  draft: CollectionAccessGrant[],
): UpdateCollectionAccessRequest {
  const savedByKey = new Map(saved.map((grant) => [principalKey(grant), grant]))
  const draftKeys = new Set(draft.map(principalKey))
  const toGrant = ({ role_id, user_id, access_level }: CollectionAccessGrant) => ({ role_id, user_id, access_level })
  return {
    add: draft.filter((grant) => savedByKey.get(principalKey(grant))?.access_level !== grant.access_level).map(toGrant),
    remove: saved
      .filter((grant) => !draftKeys.has(principalKey(grant)))
      .map(({ role_id, user_id }) => ({ role_id, user_id })),
  }
}

export const hasAccessChanges = (changes: UpdateCollectionAccessRequest) =>
  changes.add.length > 0 || changes.remove.length > 0
