export interface Section {
  id: string;
  name: string;
}

export interface AddSectionFormProps {
  templateId: string;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isPending: boolean;
  existingSections?: Section[];
}
