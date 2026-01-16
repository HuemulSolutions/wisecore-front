import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionForm } from "@/components/sections/sections-form";
import { useState } from "react";

interface Section {
  id: string;
  name: string;
}

interface AddSectionFormProps {
  documentId: string;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections?: Section[];
}

export function AddSectionForm({ documentId, onSubmit, onCancel, isPending, existingSections = [] }: AddSectionFormProps) {
  const [isFormValid, setIsFormValid] = useState(false);

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionForm
          mode="create"
          editorType="rich"
          formId="add-document-section-form"
          documentId={documentId}
          onSubmit={handleSubmit}
          isPending={isPending}
          existingSections={existingSections}
          onValidationChange={setIsFormValid}
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 py-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="hover:cursor-pointer">
          Cancel
        </Button>
        <Button type="submit" form="add-document-section-form" disabled={!isFormValid || isPending} className="hover:cursor-pointer">
          {isPending ? "Adding..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}