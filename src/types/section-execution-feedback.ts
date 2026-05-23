export interface SectionExecutionFeedbackProps {
  executionId: string;
  sectionId: string;
  sectionIndex: number;
  executionMode: 'single' | 'from';
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}
