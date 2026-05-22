import { useEffect } from "react";
import { SectionForm } from "@/components/sections/sections-form";
import type { AddSectionExecutionRequest } from "@/services/section_execution";
import type { AddSectionExecutionFormProps } from '@/types/sections-execution-add-form';
export type { AddSectionExecutionFormProps } from '@/types/sections-execution-add-form';

export function AddSectionExecutionForm({ 
  onSubmit, 
  isPending, 
  afterFromId,
  existingSections,
  onValidationChange,
  defaultType,
  defaultManualInput,
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
      defaultType={defaultType}
      defaultManualInput={defaultManualInput}
    />
  );
}
