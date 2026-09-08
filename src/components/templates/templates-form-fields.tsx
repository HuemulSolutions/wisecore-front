import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import type { TemplateFormFieldsProps } from '@/types/templates';
export type { TemplateFormFieldsProps, TemplateFormValues } from '@/types/templates';

export function TemplateFormFields({ values, onChange, disabled = false }: TemplateFormFieldsProps) {
  const { t } = useTranslation('templates');

  return (
    <>
      <HuemulField
        label={t('form.templateName')}
        type="text"
        value={values.name}
        onChange={(v) => onChange({ name: String(v) })}
        placeholder={t('form.templateNamePlaceholder')}
        required
        disabled={disabled}
      />
      <HuemulField
        type="switch"
        label={t('form.contextRequired')}
        value={values.contextRequired}
        onChange={(v) => onChange({ contextRequired: Boolean(v) })}
        description={t('form.contextRequiredDescription')}
        disabled={disabled}
        labelFirst
        className="px-4 py-3.5 border rounded-[10px]"
      />
      <HuemulField
        label={t('form.description')}
        type="textarea"
        value={values.description}
        onChange={(v) => onChange({ description: String(v) })}
        placeholder={t('form.descriptionPlaceholder')}
        rows={9}
        disabled={disabled}
      />
      <HuemulField
        label={t('form.instructions')}
        type="textarea"
        value={values.instructions}
        onChange={(v) => onChange({ instructions: String(v) })}
        placeholder={t('form.instructionsPlaceholder')}
        rows={9}
        disabled={disabled}
      />
    </>
  );
}
