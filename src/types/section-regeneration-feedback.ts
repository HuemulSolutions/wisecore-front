export interface SectionRegenerationFeedbackProps {
  sectionIndex: number;
  executionId: string;
  executionMode: 'single' | 'from';
  totalSections: number;
}
