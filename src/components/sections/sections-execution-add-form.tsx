import { useEffect } from "react";
import { SectionForm } from "@/components/sections/sections-form";
import type { AddSectionExecutionRequest } from "@/services/section_execution";

interface SectionOption {
  id: string;
  name: string;
}

interface AddSectionExecutionFormProps {
  onSubmit: (values: AddSectionExecutionRequest) => void;
  isPending: boolean;
  afterFromId: string | null;
  existingSections: SectionOption[];
  onValidationChange?: (isValid: boolean) => void;
}

export function AddSectionExecutionForm({ 
  onSubmit, 
  isPending, 
  afterFromId,
  existingSections,
  onValidationChange 
}: AddSectionExecutionFormProps) {
  useEffect(() => {
    onValidationChange?.(false);
  }, [onValidationChange]);

  const handleSubmit = (values: AddSectionExecutionRequest) => {
    const submitData: AddSectionExecutionRequest & {
      document_id?: string;
      template_id?: string;
    } = { ...values };

    delete submitData.document_id;
    delete submitData.template_id;

    onSubmit({
      ...submitData,
      after_from: afterFromId,
    });
  };

  return (
    <SectionForm
      mode="create"
      editorType="rich"
      formId="add-section-execution-form"
      onSubmit={handleSubmit}
      isPending={isPending}
      existingSections={existingSections}
      onValidationChange={onValidationChange}
    />
  );
}
