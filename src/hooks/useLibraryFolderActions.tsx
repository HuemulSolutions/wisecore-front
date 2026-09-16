import { useCallback, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus } from 'lucide-react'

import { useUserPermissions } from '@/hooks/useUserPermissions'
import type {
  HuemulFileTreeRef,
  HuemulTreeMenuAction,
  HuemulTreeNode,
  HuemulTreeToolbarAction,
} from '@/types/huemul'
import type { CreateFolderSheetProps } from '@/types/assets'
import type { LibraryContentFolderType } from '@/types/folders'

/**
 * Lo que un nodo de carpeta debe llevar en `metadata` para que el `show` del
 * ítem de menú pueda decidir. Lo aporta el `mapFolder` del consumidor (ver
 * buildLibraryTree en src/lib/library-tree.ts): ambos campos vienen tal cual
 * en `LibraryContentFolder`.
 */
export interface LibraryFolderNodeMetadata {
  folderType?: LibraryContentFolderType | null
  accessLevels?: string[]
}

interface UseLibraryFolderActionsParams {
  /** Ref del árbol, para refrescarlo cuando la carpeta ya está creada. */
  treeRef: RefObject<HuemulFileTreeRef | null>
  /** Carpeta seleccionada: destino del botón de la franja. `null` = raíz. */
  activeFolderId?: string | null
  /** Se llama con la carpeta recién creada (p.ej. para seleccionarla). */
  onFolderCreated?: (folder: { id: string; name: string }) => void
}

interface UseLibraryFolderActionsResult {
  toolbarActions: HuemulTreeToolbarAction[]
  menuActions: HuemulTreeMenuAction[]
  /** Se esparcen sobre `<CreateFolderSheet />`, montado como SIBLING del sheet padre. */
  createFolderSheetProps: CreateFolderSheetProps
  /** Para el reset del sheet/diálogo padre al cerrarse. */
  closeCreateFolderSheet: () => void
}

/**
 * Kit de acciones contextuales de "crear carpeta" para cualquier superficie que
 * monte el árbol de la biblioteca de activos (pickers de carpeta destino,
 * diálogos de selección, etc.). Devuelve la acción de franja, el ítem de menú
 * por nodo y las props del sheet de creación — todo gateado por RBAC.
 *
 * La mutation, la validación, el toast y la invalidación de `["library", orgId]`
 * viven en `CreateFolderSheet`; acá NO se reimplementan (ver
 * ia context/inline-create-entity-in-sheet-guide.md).
 */
export function useLibraryFolderActions({
  treeRef,
  activeFolderId,
  onFolderCreated,
}: UseLibraryFolderActionsParams): UseLibraryFolderActionsResult {
  const { t } = useTranslation('assets')
  const { canCreate } = useUserPermissions()
  const canCreateFolder = canCreate('folder')

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [parentFolderId, setParentFolderId] = useState<string | null>(null)

  const openFor = useCallback((parentId: string | null) => {
    setParentFolderId(parentId)
    setIsSheetOpen(true)
  }, [])

  const closeCreateFolderSheet = useCallback(() => setIsSheetOpen(false), [])

  const handleFolderCreated = useCallback(
    (folder?: { id: string; name: string }) => {
      setIsSheetOpen(false)
      treeRef.current?.refresh()
      if (folder) onFolderCreated?.(folder)
    },
    [treeRef, onFolderCreated],
  )

  const toolbarActions = useMemo<HuemulTreeToolbarAction[]>(() => {
    if (!canCreateFolder) return []
    return [
      {
        key: 'create-folder',
        label: t('fileTree.newFolder'),
        icon: FolderPlus,
        // Sin carpeta seleccionada, la nueva cuelga de la raíz.
        onClick: () => openFor(activeFolderId ?? null),
      },
    ]
  }, [canCreateFolder, t, activeFolderId, openFor])

  const menuActions = useMemo<HuemulTreeMenuAction[]>(
    () => [
      {
        label: t('fileTree.newSubfolder'),
        icon: <FolderPlus className="h-4 w-4" />,
        onClick: async (nodeId: string) => openFor(nodeId),
        show: (node: HuemulTreeNode) => {
          if (node.type !== 'folder') return false
          const metadata = node.metadata as LibraryFolderNodeMetadata | undefined
          // Grupal y Forms no admiten contenido directo — misma regla que el
          // menú del nav de conocimiento (nav-knowledge.tsx).
          if (metadata?.folderType === 'grupal' || metadata?.folderType === 'forms') return false
          // Permiso global O grant de creación sobre esa carpeta puntual.
          return canCreateFolder || !!metadata?.accessLevels?.includes('create')
        },
      },
    ],
    [t, openFor, canCreateFolder],
  )

  const createFolderSheetProps = useMemo<CreateFolderSheetProps>(
    () => ({
      open: isSheetOpen,
      onOpenChange: setIsSheetOpen,
      parentFolder: parentFolderId ?? undefined,
      onFolderCreated: handleFolderCreated,
    }),
    [isSheetOpen, parentFolderId, handleFolderCreated],
  )

  return { toolbarActions, menuActions, createFolderSheetProps, closeCreateFolderSheet }
}
