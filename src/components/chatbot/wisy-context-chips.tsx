import { X, FileText, FolderClosed, Zap, Plus } from 'lucide-react';
import type { WorkingContextItem } from '@/types/chatbot';

const TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string }> = {
  document: { icon: FileText, label: 'Document' },
  folder: { icon: FolderClosed, label: 'Folder' },
  execution: { icon: Zap, label: 'Version' },
};

interface WisyContextChipProps {
  item: WorkingContextItem;
  onRemove: (type: string, id: string) => void;
}

function WisyContextChip({ item, onRemove }: WisyContextChipProps) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.document;
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1 max-w-[180px] rounded-md bg-primary text-primary-foreground pl-1.5 pr-0.5 py-0.5 text-[11px] leading-tight font-medium shadow-sm">
      <Icon className="w-3 h-3 shrink-0 opacity-80" />
      <span className="truncate">{item.name}</span>
      <button
        type="button"
        onClick={() => onRemove(item.type, item.id)}
        className="shrink-0 rounded p-0.5 hover:bg-white/20 hover:cursor-pointer transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

interface WisyContextChipsProps {
  items: WorkingContextItem[];
  onRemove: (type: string, id: string) => void;
  /** Current page context item to suggest adding */
  currentPageContext?: WorkingContextItem | null;
  /** Called when the user clicks the "add current page" badge */
  onAddCurrentPage?: () => void;
}

export function WisyContextChips({ items, onRemove, currentPageContext, onAddCurrentPage }: WisyContextChipsProps) {
  const hasChips = items.length > 0;
  const hasPageBadge = currentPageContext && onAddCurrentPage;

  if (!hasChips && !hasPageBadge) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mb-2">
      {hasChips && (
        <>
          {items.map((item) => (
            <WisyContextChip
              key={`${item.type}:${item.id}`}
              item={item}
              onRemove={onRemove}
            />
          ))}
        </>
      )}
      {hasPageBadge && (
        <button
          type="button"
          onClick={onAddCurrentPage}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 bg-transparent pl-1.5 pr-1.5 py-0.5 text-[11px] leading-tight text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 hover:cursor-pointer transition-colors"
        >
          {currentPageContext.type === 'execution' ? (
            <Zap className="w-3 h-3 shrink-0" />
          ) : currentPageContext.type === 'folder' ? (
            <FolderClosed className="w-3 h-3 shrink-0" />
          ) : (
            <FileText className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate max-w-[120px]">{currentPageContext.name}</span>
          <Plus className="w-2.5 h-2.5 shrink-0" />
        </button>
      )}
    </div>
  );
}
