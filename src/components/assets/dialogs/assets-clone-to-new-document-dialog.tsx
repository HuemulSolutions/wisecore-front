import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Folder, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulFileTree } from '@/huemul/components/huemul-file-tree';
import { getLibraryContent } from '@/services/folders';
import type { HuemulTreeNode } from '@/types/huemul/tree';

interface CloneToNewDocumentOptions {
  name?: string;
  internal_code?: string;
  description?: string;
  folder_id?: string;
}

interface CloneToNewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: CloneToNewDocumentOptions) => void;
  isProcessing?: boolean;
  organizationId: string;
}

export function CloneToNewDocumentDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  organizationId,
}: CloneToNewDocumentDialogProps) {
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

  const handleLoadChildren = useCallback(async (folderId: string | null): Promise<HuemulTreeNode[]> => {
    const content = await getLibraryContent(organizationId, folderId || undefined);
    return content.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      hasChildren: true,
    }));
  }, [organizationId]);

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
    <HuemulDialog
      open={open}
      onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}
      title={t('content.cloneToNewDocumentTitle')}
      description={t('content.cloneToNewDocumentDescription')}
      icon={Copy}
      iconClassName="h-4 w-4 text-[#4464f7]"
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t('content.cloneToNewDocumentConfirm'),
        onClick: handleConfirm,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="clone-new-name" className="text-sm font-medium">
            {t('content.cloneToNewDocumentName')}
          </Label>
          <Input
            id="clone-new-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('content.cloneToNewDocumentNamePlaceholder')}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clone-new-internal-code" className="text-sm font-medium">
            {t('content.cloneToNewDocumentInternalCode')}
          </Label>
          <Input
            id="clone-new-internal-code"
            value={internalCode}
            onChange={(e) => setInternalCode(e.target.value)}
            placeholder={t('content.cloneToNewDocumentInternalCodePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clone-new-description" className="text-sm font-medium">
            {t('content.cloneToNewDocumentDescriptionLabel')}
          </Label>
          <Textarea
            id="clone-new-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('content.cloneToNewDocumentDescriptionPlaceholder')}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {t('content.cloneToNewDocumentFolder')}
          </Label>
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
            minHeight="150px"
          />
        </div>
      </div>
    </HuemulDialog>
  );
}
