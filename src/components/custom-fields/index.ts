import type { CustomField } from "@/types/custom-fields";

// Main types
export interface CustomFieldPageState {
  searchTerm: string;
  selectedCustomFields: Set<string>;
  editingCustomField: CustomField | null;
  showCreateDialog: boolean;
  deletingCustomField: CustomField | null;
}

// Re-export components
export { CustomFieldPageHeader } from "./custom-field-page-header";
export { CustomFieldTable } from "./custom-field-table";
export { CustomFieldPageSkeleton } from "./custom-field-page-skeleton";
export { CustomFieldPageEmptyState } from "./custom-field-page-empty-state";
export { CustomFieldContentEmptyState } from "./custom-field-content-empty-state";
export { CustomFieldPageDialogs } from "./custom-field-page-dialogs";

// Types re-export
export type { CustomField };