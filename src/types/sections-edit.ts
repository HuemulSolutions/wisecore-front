import type { Section } from '@/types/sections-add'

export interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

export interface ItemForBackend {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: string[];
}

export interface EditSectionProps {
  item: Item;
  onCancel: () => void;
  onSave: (updatedItem: ItemForBackend) => void;
  existingSections?: Section[];
}
