import { useCallback } from "react"
import { useUserPermissions } from "@/hooks/useUserPermissions"

/**
 * Regla única de "lo mío" en las discusiones: el autor edita, borra o resuelve lo que escribió
 * solo si puede comentar (`discussion:c`). Sin ese permiso (por ejemplo en el modo Consulta de
 * una colección) lo suyo queda de solo lectura, igual que lo de los demás. Los permisos de
 * moderación (`discussion:u` / `discussion:d`) se evalúan aparte en cada componente.
 */
export function useOwnCommentRights() {
  const { canCreate } = useUserPermissions()
  const canComment = canCreate("discussion")
  const isOwnAndCanComment = useCallback(
    (currentUserId: string | null | undefined, authorId: string | null | undefined) =>
      canComment && !!currentUserId && currentUserId === authorId,
    [canComment],
  )
  return { canComment, isOwnAndCanComment }
}
