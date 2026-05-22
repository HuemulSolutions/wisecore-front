import type { Section } from '@/types/sections-add'
import type { Item, ItemForBackend } from '@/types/sections-edit-form'

export type { Item, ItemForBackend } from '@/types/sections-edit-form'

export interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  onSave: (updatedItem: ItemForBackend) => void;
  existingSections?: Section[];
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
}
