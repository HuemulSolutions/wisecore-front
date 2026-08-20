import { useQuery } from '@tanstack/react-query';

import { getLibraryContent } from '@/services/folders';
import type { LibraryContentAsset, LibraryContentFolder } from '@/types/folders';

const PAGE_SIZE = 100;

export const mentionFolderContentQueryKeys = {
  all: ['mention-folder-content'] as const,
  folder: (organizationId: string, folderId: string | null) =>
    [...mentionFolderContentQueryKeys.all, organizationId, folderId ?? 'root'] as const,
};

/**
 * Contenido de UNA carpeta para el modo "explorar" del combobox de mención `@`
 * (sin término de búsqueda): carpetas navegables + documentos, con sus
 * versiones ya incluidas (include_executions) para que el drill-in a versión
 * no dispare otra llamada.
 */
export function useMentionFolderContent(organizationId: string | undefined, folderId: string | null, enabled: boolean) {
  const query = useQuery({
    queryKey: mentionFolderContentQueryKeys.folder(organizationId ?? '', folderId),
    queryFn: () =>
      getLibraryContent(
        organizationId!,
        folderId ?? undefined,
        1,
        PAGE_SIZE,
        undefined,
        undefined,
        undefined,
        { includeExecutions: true },
      ),
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const folders: LibraryContentFolder[] = query.data?.folders ?? [];
  const assets: LibraryContentAsset[] = query.data?.assets ?? [];

  return { folders, assets, hasNext: query.data?.has_next ?? false, isLoading: query.isLoading };
}
