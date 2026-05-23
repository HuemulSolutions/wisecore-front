export interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  canCreate?: boolean;
}
