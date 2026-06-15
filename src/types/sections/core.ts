import type { CustomFieldDataType } from "@/types/custom-fields/core";

export type Dependency = {
  id: string
  name: string
}

export interface SectionFormField {
  field_id: string;
  field_name: string;
  data_type: CustomFieldDataType;
  required?: boolean;
  order?: number;
}

export interface SortableSectionItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
  type?: "ai" | "manual" | "reference" | "form"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
  form_fields?: SectionFormField[]
}

export interface SortableSectionSheetItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
  type?: "ai" | "manual" | "reference" | "form"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
  form_fields?: SectionFormField[]
}

export interface SectionCoreItem {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
}

export interface SectionComponentProps {
  item: SectionCoreItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}
