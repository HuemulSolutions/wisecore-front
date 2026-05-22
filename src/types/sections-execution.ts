export interface SectionExecutionProps {
  sectionExecution: {
    id: string;
    section_execution_id?: string;
    name?: string;
    prompt: string;
    output: string;
  };
  onUpdate?: () => void;
  readyToEdit: boolean;
}
