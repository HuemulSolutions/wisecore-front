export interface TemplateHeaderProps {
  templateName: string;
  templateDescription?: string;
  isMobile: boolean;
  hasNoSections: boolean;
  isGenerating: boolean;
  isRefreshing?: boolean;
  activeTab?: string;
  onToggleSidebar?: () => void;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onInfo?: () => void;
}
