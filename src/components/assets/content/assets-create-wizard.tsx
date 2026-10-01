import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { CREATE_OPTIONS, type CreateOptionActions, type CreateOptionId } from './create-options';

interface AssetCreateWizardProps {
  folderId?: string;
  actions: CreateOptionActions;
}

/**
 * Asistente de creación del estado «sin asset»: el usuario indica con qué cuenta y el panel de la
 * derecha recomienda el método; el CTA abre el flujo de creación existente con ese método.
 */
export function AssetCreateWizard({ folderId, actions }: AssetCreateWizardProps) {
  const { t } = useTranslation('assets');
  const [selectedId, setSelectedId] = useState<CreateOptionId>(CREATE_OPTIONS[0].id);
  const selected = CREATE_OPTIONS.find((option) => option.id === selectedId) ?? CREATE_OPTIONS[0];
  const k = (id: CreateOptionId, key: string) => t(`createWizard.options.${id}.${key}`);
  const Icon = selected.icon;

  return (
    <Card className="grid grid-cols-1 gap-0 overflow-hidden rounded-[14px] border-[#e2e8f0] bg-white p-0 shadow-none md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-3.5 p-6 md:border-r md:border-[#eef1f5]">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">{t('createWizard.cardTitle')}</h3>
        <RadioGroup
          value={selectedId}
          onValueChange={(value) => setSelectedId(value as CreateOptionId)}
          aria-label={t('createWizard.optionsLabel')}
          className="gap-2"
        >
          {CREATE_OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;
            const inputId = `create-option-${option.id}`;
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[10px] px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500/40',
                  isSelected
                    ? 'border-[1.5px] border-[#2563eb] bg-[#f5f8ff]'
                    : 'border border-[#e2e8f0] bg-white hover:bg-[#fafbfc]',
                )}
              >
                <RadioGroupItem id={inputId} value={option.id} className="size-[18px]" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13.5px] font-semibold text-[#0f172a]">{k(option.id, 'question')}</span>
                  <span className="text-[12.5px] text-[#64748b]">{k(option.id, 'subtitle')}</span>
                </span>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-3 bg-[#fafbfc] p-6" data-testid="create-recommendation">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
          {t('createWizard.recommendation')}
        </p>
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: selected.bg, color: selected.fg }}
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
          <h4 className="text-base font-semibold text-[#0f172a]">{k(selected.id, 'title')}</h4>
        </div>
        <p className="text-[13px] leading-[1.55] text-[#475569]">{k(selected.id, 'text')}</p>
        <div className="flex flex-col gap-2 border-t border-dashed border-[#e2e8f0] pt-3">
          <p className="text-xs font-semibold text-[#334155]">{t('createWizard.toComplete')}</p>
          <ul className="flex flex-col gap-1.5">
            {Array.from({ length: selected.fieldCount }, (_, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#475569]">
                <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[#cbd5e1]" aria-hidden="true" />
                {k(selected.id, `field${i + 1}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          className="h-9 w-full bg-[#2563eb] text-white hover:cursor-pointer hover:bg-[#1d4ed8]"
          onClick={() => selected.onClick(actions, folderId)}
        >
          {k(selected.id, 'cta')}
        </Button>
      </div>
    </Card>
  );
}
