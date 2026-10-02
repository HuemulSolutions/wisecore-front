import { useTranslation } from "react-i18next";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
        label={t('form.description')}
        type="textarea"
        value={values.description}
        onChange={(v) => onChange({ description: String(v) })}
        placeholder={t('form.descriptionPlaceholder')}
        rows={4}
        disabled={disabled}
      />
      <HuemulField
        label={t('form.instructions')}
        type="textarea"
        value={values.instructions}
        onChange={(v) => onChange({ instructions: String(v) })}
        placeholder={t('form.instructionsPlaceholder')}
        rows={4}
        disabled={disabled}
      />
      <Separator />
      <div className="space-y-2">
        <HuemulField
          type="switch"
          label={t('form.contextRequired')}
          value={values.contextRequired}
          onChange={(v) => onChange({ contextRequired: Boolean(v) })}
          helpText={t('form.contextRequiredHelpText')}
          disabled={disabled}
          labelFirst
          className={cn(
            "px-4 py-3.5 border rounded-[10px]",
            values.contextRequired && "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
          )}
        />
        <p
          className={cn(
            "text-sm px-4",
            values.contextRequired ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          )}
        >
          {values.contextRequired
            ? t('form.contextRequiredDescriptionOn')
            : t('form.contextRequiredDescriptionOff')}
        </p>
      </div>
    </>
  );
}
