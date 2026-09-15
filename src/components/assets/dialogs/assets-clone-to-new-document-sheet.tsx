import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Folder, X } from 'lucide-react';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField, HuemulFieldGroup } from '@/huemul/components/huemul-field';
import { HuemulFileTree } from '@/huemul/components/huemul-file-tree';
import { getLibraryContent } from '@/services/folders';
import { useLibraryTreeExpansion } from '@/hooks/useLibraryTreeExpansion';
import { buildLibraryTree } from '@/lib/library-tree';
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

  useEffect(() => {
    if (open) {
      setName('');
      setInternalCode('');
      setDescription('');
      setSelectedFolderId(null);
      setSelectedFolderName(null);
    }
  }, [open]);

  // Comparte la clave `tree-expanded` con el sidebar de conocimiento y el
  // resto de pickers de biblioteca — ver ia context/arbol-biblioteca-activos-guide.md.
  const { loadRoot, treeProps: expansionTreeProps } = useLibraryTreeExpansion({ organizationId });

  const mapFolder = useCallback((folder: LibraryContentFolder): HuemulTreeNode => ({
    id: folder.id,
    name: folder.name,
    type: 'folder',
    hasChildren: true,
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
            onLoadChildren={handleLoadChildren}
            onFolderClick={handleFolderClick}
            activeNodeId={selectedFolderId ?? undefined}
            showCreateButtons={false}
            showDefaultActions={{ create: false, delete: false, share: false }}
            showBorder={true}
            minHeight="320px"
            {...expansionTreeProps}
          />
        </div>
      </HuemulFieldGroup>
    </HuemulSheet>
  );
}

export const CloneToNewDocumentSheet = memo(CloneToNewDocumentSheetInner);
