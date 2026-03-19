import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { List, Plus, Sparkles } from "lucide-react";

interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  canCreate?: boolean;
}

export function TemplateEmptyState({
  isGenerating,
  onAddSection,
  onGenerateWithAI,
  canCreate = true,
}: TemplateEmptyStateProps) {
  const { t } = useTranslation('templates');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-8 text-center">
        <List className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-2">{t('emptyState.noSectionsYet')}</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
          {t('emptyState.description')}
        </p>
        <div className="flex items-center justify-center gap-2">
          {canCreate && (
            <>
              <HuemulButton
                icon={Plus}
                iconClassName="h-4 w-4 mr-2"
                label={t('emptyState.addSection')}
                size="sm"
                disabled={isGenerating}
                className="bg-[#4464f7] hover:bg-[#3451e6] h-9 text-sm px-4"
                onClick={onAddSection}
              />
              <HuemulButton
                icon={Sparkles}
                iconClassName="h-4 w-4 mr-2"
                label={t('emptyState.generateWithAI')}
                size="sm"
                variant="outline"
                className="h-9 text-sm px-4"
                loading={isGenerating}
                onClick={onGenerateWithAI}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
