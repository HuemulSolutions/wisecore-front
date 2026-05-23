export interface TemplateSectionsListProps {
  sections: any[];
  templateId: string;
  organizationId: string;
  onSectionsReorder: (newSections: any[]) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}
