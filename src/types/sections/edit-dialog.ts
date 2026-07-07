import type { Section } from './add'
import type { EditFormItem, EditFormItemForBackend } from './edit-form'

export type { EditFormItem as Item, EditFormItemForBackend as ItemForBackend } from './edit-form'

export interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EditFormItem;
  onSave: (updatedItem: EditFormItemForBackend) => void;
  existingSections?: Section[];
  onGeneratingChange?: (isGenerating: boolean) => void;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  documentId?: string;
  templateId?: string;
}
