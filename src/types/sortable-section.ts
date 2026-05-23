import type { SortableSectionItem } from '@/types/sections'

export interface SortableSectionProps {
  item: SortableSectionItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}
