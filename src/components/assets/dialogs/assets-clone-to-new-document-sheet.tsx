import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Folder, X } from 'lucide-react';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField, HuemulFieldGroup } from '@/huemul/components/huemul-field';
import { HuemulFileTree } from '@/huemul/components/huemul-file-tree';
import { CreateFolderSheet } from '@/components/assets/dialogs/assets-create-folder-sheet';
import { getLibraryContent } from '@/services/folders';
import { useLibraryTreeExpansion } from '@/hooks/useLibraryTreeExpansion';
import { useLibraryFolderActions } from '@/hooks/useLibraryFolderActions';
import { buildLibraryTree } from '@/lib/library-tree';
import type { HuemulFileTreeRef } from '@/huemul/components/huemul-file-tree';
import type { HuemulTreeNode } from '@/types/huemul/tree';
import type { LibraryContentFolder } from '@/types/folders';

interface CloneToNewDocumentOptions {
  name?: string;
  internal_code?: string;
  description?: string;
  folder_id?: string;
}

interface CloneToNewDocumentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: CloneToNewDocumentOptions) => void;
  isProcessing?: boolean;
  organizationId: string;
}

function CloneToNewDocumentSheetInner({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  organizationId,
}: CloneToNewDocumentSheetProps) {
  const { t } = useTranslation('assets');
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const treeRef = useRef<HuemulFileTreeRef>(null);

  // Crear carpeta destino sin salir del sheet: la franja de acciones y el ítem
  // "Nueva subcarpeta" del menú de cada carpeta salen de este hook, gateados
  // por `folder:c`. El formulario real es CreateFolderSheet, montado abajo como
  // sibling — ver ia context/inline-create-entity-in-sheet-guide.md.
  const {
    toolbarActions,
    menuActions,
    createFolderSheetProps,
    closeCreateFolderSheet,
  } = useLibraryFolderActions({
    treeRef,
    activeFolderId: selectedFolderId,
    // La carpeta recién creada pasa a ser el destino: el usuario la creó para
    // usarla, no para volver a buscarla en el árbol.
    onFolderCreated: (folder) => {
      setSelectedFolderId(folder.id);
      setSelectedFolderName(folder.name);
    },
  });

  useEffect(() => {
    if (open) {
      setName('');
      setInternalCode('');
      setDescription('');
      setSelectedFolderId(null);
      setSelectedFolderName(null);
      closeCreateFolderSheet();
    }
  }, [open, closeCreateFolderSheet]);

  // Comparte la clave `tree-expanded` con el sidebar de conocimiento y el
  // resto de pickers de biblioteca — ver ia context/arbol-biblioteca-activos-guide.md.
  const { loadRoot, treeProps: expansionTreeProps } = useLibraryTreeExpansion({ organizationId });

  const mapFolder = useCallback((folder: LibraryContentFolder): HuemulTreeNode => ({
    id: folder.id,
    name: folder.name,
    type: 'folder',
    hasChildren: true,
    // Lo consume el `show` de "Nueva subcarpeta" (useLibraryFolderActions).
    metadata: { folderType: folder.folder_type, accessLevels: folder.access_levels },
  }), []);

  const handleLoadChildren = useCallback(async (folderId: string | null): Promise<HuemulTreeNode[]> => {
    // Sin mapAsset: este picker solo elige una carpeta destino, los assets no
    // son seleccionables — se descartan (ver buildLibraryTree).
    if (folderId === null) {
      const { content } = await loadRoot();
      return buildLibraryTree<HuemulTreeNode>(content, { parentFolderId: null, mapFolder });
    }
    const content = await getLibraryContent(organizationId, folderId);
    return buildLibraryTree<HuemulTreeNode>(content, { parentFolderId: folderId, mapFolder });
  }, [organizationId, loadRoot, mapFolder]);

  function handleFolderClick(node: HuemulTreeNode) {
    if (selectedFolderId === node.id) {
      setSelectedFolderId(null);
      setSelectedFolderName(null);
    } else {
      setSelectedFolderId(node.id);
      setSelectedFolderName(node.name);
    }
  }

  function handleConfirm() {
    onConfirm({
      name: name.trim() || undefined,
      internal_code: internalCode.trim() || undefined,
      description: description.trim() || undefined,
      folder_id: selectedFolderId || undefined,
    });
  }

  return (
    <>
    <HuemulSheet
      open={open}
      onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}
      title={t('content.cloneToNewDocumentTitle')}
      description={t('content.cloneToNewDocumentDescription')}
      icon={Copy}
      side="right"
      maxWidth="sm:max-w-2xl"
      saveAction={{
        label: t('content.cloneToNewDocumentConfirm'),
        onClick: handleConfirm,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup>
        <HuemulField
          type="text"
          label={t('content.cloneToNewDocumentName')}
          name="clone-new-name"
          value={name}
          onChange={(v) => setName(String(v))}
          placeholder={t('content.cloneToNewDocumentNamePlaceholder')}
          disabled={isProcessing}
        />
        <HuemulField
          type="text"
          label={t('content.cloneToNewDocumentInternalCode')}
          name="clone-new-internal-code"
          value={internalCode}
          onChange={(v) => setInternalCode(String(v))}
          placeholder={t('content.cloneToNewDocumentInternalCodePlaceholder')}
          disabled={isProcessing}
        />
        <HuemulField
          type="textarea"
          label={t('content.cloneToNewDocumentDescriptionLabel')}
          name="clone-new-description"
          value={description}
          onChange={(v) => setDescription(String(v))}
          placeholder={t('content.cloneToNewDocumentDescriptionPlaceholder')}
          rows={3}
          disabled={isProcessing}
        />
        <div className="space-y-1.5">
          <span className="text-sm font-medium leading-snug">
            {t('content.cloneToNewDocumentFolder')}
          </span>
          {selectedFolderName ? (
            <div className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5">
              <Folder className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="flex-1 truncate text-sm text-blue-700 font-medium">{selectedFolderName}</span>
              <button
                type="button"
                onClick={() => { setSelectedFolderId(null); setSelectedFolderName(null); }}
                className="ml-auto text-blue-400 hover:text-blue-600 hover:cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('content.cloneToNewDocumentFolderHint')}</p>
          )}
          <HuemulFileTree
            ref={treeRef}
            onLoadChildren={handleLoadChildren}
            onFolderClick={handleFolderClick}
            activeNodeId={selectedFolderId ?? undefined}
            toolbarActions={toolbarActions}
            menuActions={menuActions}
            showCreateButtons={false}
            showDefaultActions={{ create: false, delete: false, share: false }}
            showBorder={true}
            minHeight="320px"
            {...expansionTreeProps}
          />
        </div>
      </HuemulFieldGroup>
    </HuemulSheet>

    {/* Sibling, no anidado en los children del sheet de arriba: ambos son
        z-50 y el que monta después pinta encima (ver z-index-layering-guide). */}
    <CreateFolderSheet {...createFolderSheetProps} />
    </>
  );
}

export const CloneToNewDocumentSheet = memo(CloneToNewDocumentSheetInner);
