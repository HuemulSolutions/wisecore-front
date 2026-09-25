// NOTE: AddSectionDialogProps conflicts with the assets version.
// Import directly from '@/types/templates/add-section-dialog' if needed.
export interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  organizationId: string;
  existingSections: any[];
  onGeneratingChange?: (isGenerating: boolean) => void;
  defaultType?: 'ai' | 'manual' | 'reference' | 'form';
  /** Nombre de la plantilla — arma el subtítulo dinámico del sheet. */
  containerName?: string;
}
