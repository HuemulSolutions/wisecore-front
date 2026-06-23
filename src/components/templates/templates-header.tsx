import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulExpandableText } from "@/huemul/components/huemul-expandable-text";
import { Button } from "@/components/ui/button";
import { Plus, List, RefreshCw, Info, Sparkles } from "lucide-react";
import type { TemplateHeaderProps } from '@/types/templates';
export type { TemplateHeaderProps } from '@/types/templates';

export function TemplateHeader({
  templateName,
  templateDescription,
  templateInstructions,
  isMobile,
  isGenerating,
  isRefreshing = false,
  onToggleSidebar,
  onAddSection,
  onRefresh,
  onInfo,
}: TemplateHeaderProps) {
  const { t } = useTranslation(['common', 'templates']);

  const instructions = templateInstructions?.trim();
  const instructionsCallout = instructions ? (
    <HuemulExpandableText
      text={instructions}
      collapsedLines={1}
      expandedMaxHeight={100}
      showMoreLabel={t('templates:header.showMore')}
      showLessLabel={t('templates:header.showLess')}
      className="mt-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5"
      leading={
        <>
          <span className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('templates:header.instructionsTitle')}
            </span>
          </span>
          <span className="w-px self-stretch bg-gray-200" aria-hidden="true" />
        </>
      }
    />
  ) : null;

  if (isMobile) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm py-1 px-3 z-20 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleSidebar}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer shrink-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-gray-900 truncate">
                {templateName}
              </span>
            </div>
            {templateDescription && (
              <p className="text-[10px] text-gray-600 truncate ml-9">
                {templateDescription}
              </p>
            )}
            {instructionsCallout && (
              <div className="ml-9 max-w-full">{instructionsCallout}</div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <HuemulButton
              icon={RefreshCw}
              iconClassName="h-3.5 w-3.5"
              size="sm"
              variant="ghost"
              loading={isRefreshing}
              disabled={isGenerating}
              tooltip={t('refresh')}
              className="h-7 w-7 p-0 hover:bg-gray-100 shrink-0"
              onClick={onRefresh}
            />
            <HuemulButton
              icon={Plus}
              iconClassName="h-3.5 w-3.5"
              size="sm"
              disabled={isGenerating}
              className="bg-[#4464f7] hover:bg-[#3451e6] h-7 shrink-0"
              onClick={onAddSection}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-4 z-10 shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          {/* Template Name */}
          <h1 className="text-2xl font-bold text-gray-900">
            {templateName}
          </h1>
          {/* Template Description */}
          {templateDescription && (
            <p className="text-sm text-gray-600">
              {templateDescription}
            </p>
          )}
          {/* Template Instructions */}
          {instructionsCallout}
        </div>
        {onInfo && (
          <HuemulButton
            icon={Info}
            iconClassName="h-4 w-4 text-gray-500"
            variant="ghost"
            size="sm"
            tooltip={t('templates:infoSheet.title')}
            className="h-8 w-8 p-0 hover:bg-gray-100 shrink-0 mt-0.5 hover:cursor-pointer"
            onClick={onInfo}
          />
        )}
      </div>
    </div>
  );
}
