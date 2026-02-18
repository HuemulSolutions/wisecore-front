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
export { CustomFieldPageHeader } from "./custom-fields-page-header";
export { CustomFieldTable } from "./custom-fields-table";
export { CustomFieldPageSkeleton } from "./custom-fields-page-skeleton";
export { CustomFieldPageEmptyState } from "./custom-fields-page-empty-state";
export { CustomFieldContentEmptyState } from "./custom-fields-content-empty-state";
export { CustomFieldPageDialogs } from "./custom-fields-page-dialogs";

// Types re-export
export type { CustomField };