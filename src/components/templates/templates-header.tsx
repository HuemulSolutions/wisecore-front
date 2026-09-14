import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulExpandableText } from "@/huemul/components/huemul-expandable-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, List, Pencil, MoreHorizontal, Info, Copy, FileJson, Trash2 } from "lucide-react";
import type { TemplateHeaderProps } from '@/types/templates';
export type { TemplateHeaderProps } from '@/types/templates';

export function TemplateHeader({
  templateName,
  templateDescription,
  templateInstructions,
  isMobile,
  isGenerating,
  activeTab,
  canCreateSection = false,
  onToggleSidebar,
  onAddSection,
  onEdit,
  canUpdate,
  onDelete,
  canDelete,
  onInfo,
  onDuplicate,
  canDuplicate,
  onExportJson,
  canExportJson,
}: TemplateHeaderProps) {
  const { t } = useTranslation(['common', 'templates']);

  if (isMobile) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm py-1 px-3 z-(--z-page-header) shrink-0" data-mobile-header>
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
          </div>
          <div className="flex items-center gap-1">
            {canCreateSection && activeTab === 'structure' && (
              <HuemulButton
                icon={Plus}
                iconClassName="h-3.5 w-3.5"
                size="sm"
                disabled={isGenerating}
                className="bg-[#4464f7] hover:bg-[#3451e6] h-7 shrink-0"
                onClick={onAddSection}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-8 pt-5 pb-5 z-(--z-page-header) shrink-0" data-desktop-header>
      <div className="flex flex-col gap-3">
        {/* Fila superior: título + acciones */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-[25px] font-semibold tracking-[-0.01em] text-[#0f172a]">
            {templateName}
          </h1>

          {/* Acciones */}
          <div className="relative flex flex-wrap items-center gap-2">
          {canUpdate && (
            <HuemulButton
              icon={Pencil}
              iconClassName="h-3.5 w-3.5 mr-1.5"
              label={t('templates:header.editData')}
              variant="outline"
              className="h-8.5 rounded-lg border-[#d7dde5] bg-white text-[13px] text-[#334155] hover:bg-[#f4f6f8]"
              onClick={onEdit}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8.5 rounded-lg border-[#d7dde5] bg-white px-3 text-[13px] text-[#334155] hover:bg-[#f4f6f8] hover:cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                {t('templates:header.moreActions')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-[232px] rounded-[10px] border-[#e6ebf1] shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              {onInfo && (
                <>
                  <DropdownMenuItem onClick={onInfo} className="text-[13px]">
                    <Info className="h-4 w-4" />
                    {t('templates:header.viewInformation')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {canDuplicate && (
                <DropdownMenuItem onClick={onDuplicate} className="text-[13px]">
                  <Copy className="h-4 w-4" />
                  {t('templates:header.duplicateTemplate')}
                </DropdownMenuItem>
              )}
              {canExportJson && (
                <DropdownMenuItem onClick={onExportJson} className="text-[13px]">
                  <FileJson className="h-4 w-4" />
                  {t('templates:header.exportJson')}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} variant="destructive" className="text-[13px]">
                    <Trash2 className="h-4 w-4" />
                    {t('templates:content.deleteTemplate')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Fila inferior: descripción e instrucciones, a todo el ancho */}
        {(templateDescription || templateInstructions) && (
          <div className="flex flex-col gap-[7px]">
            {templateDescription && (
              <HuemulExpandableText
                text={templateDescription}
                collapsedLines={2}
                showMoreLabel={t('templates:header.showMore')}
                showLessLabel={t('templates:header.showLess')}
                textClassName="text-pretty leading-[1.55]"
              />
            )}

            {templateInstructions && (
              <HuemulExpandableText
                text={templateInstructions}
                collapsedLines={2}
                showMoreLabel={t('templates:header.showMore')}
                showLessLabel={t('templates:header.showLess')}
                textClassName="text-pretty leading-[1.55]"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
