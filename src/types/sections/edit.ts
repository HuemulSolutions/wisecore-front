import type { Section } from './add'

export interface EditItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

export interface EditItemForBackend {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: string[];
}

export interface EditSectionProps {
  item: EditItem;
  onCancel: () => void;
  onSave: (updatedItem: EditItemForBackend) => void;
  existingSections?: Section[];
}
