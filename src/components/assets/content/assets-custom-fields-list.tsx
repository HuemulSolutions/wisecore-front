import { useState } from "react";
import { Plus, RefreshCw, Edit2, MoreVertical, Trash2, Loader2, SlidersHorizontal, Star, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImagePreviewDialog } from "@/components/assets/dialogs/assets-image-preview-dialog";
import type { CustomFieldDocument } from '@/types/custom-fields';
import type { CustomFieldsListProps } from '@/types/assets';
export type { CustomFieldsListProps } from '@/types/assets';
import { useTranslation } from "react-i18next";
import { MULTI_SELECT_QUESTION_TYPES, QUESTION_TYPE } from "@/components/sections/question-type-meta";

export function CustomFieldsList({
  customFields,
  isLoading,
  onAdd,
  onEdit,
  onEditContent,
  onDelete,
  onRefresh,
  uploadingImageFieldId,
  isRefreshing,
  canEdit = false,
  page,
  pageSize,
  totalItems,
  hasNext,
  onPageChange,
}: CustomFieldsListProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const { t } = useTranslation(["assets", "common", "custom-fields"]);

  const formatCalendarDate = (dateValue: string) => {
    const normalizedDate = dateValue.split('T')[0];
    const parts = normalizedDate.split('-');

    if (parts.length !== 3) {
      return dateValue;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return dateValue;
    }

    return new Date(year, month - 1, day).toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 space-y-3 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <Button size="sm" variant="outline" disabled>
            <Plus className="h-4 w-4 mr-2" />
            {t('customFieldsList.addField')}
          </Button>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!customFields || customFields.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center py-10 px-4 text-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('customFieldsList.noCustomFields')}</p>
          <p className="text-xs text-muted-foreground">{t('customFieldsList.noCustomFieldsHint')}</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={onAdd} className="hover:cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            {t('customFieldsList.addField')}
          </Button>
        )}
      </div>
    );
  }

  // Resuelve las etiquetas seleccionadas de un campo de lista (single o multi),
  // priorizando los datos ya resueltos por el backend (selected_options/selected_option)
  // por sobre el legacy value_list/value_identifier + options.
  const getListLabels = (field: CustomFieldDocument): string[] => {
    const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(field.question_type ?? '');

    if (isMulti) {
      if (field.selected_options && field.selected_options.length > 0) {
        return field.selected_options.map(o => o.label);
      }
      if (field.value_list && field.value_list.length > 0) {
        return field.value_list.map(id => field.options?.find(o => o.id === id)?.label ?? id);
      }
      return [];
    }

    if (field.selected_option) {
      return [field.selected_option.label];
    }
    const optionId = field.value_identifier;
    if (!optionId) return [];
    const match = field.options?.find(o => o.id === optionId);
    return [match ? match.label : optionId];
  };

  const formatValue = (field: CustomFieldDocument) => {
    // If no value is set, show "Vacío" — a list field's real selection can live in
    // value_list (legacy) or selected_option/selected_options (backend-resolved), so it
    // must not be short-circuited by the generic value check.
    const hasListValues = field.data_type === 'list' && (
      (field.value_list?.length ?? 0) > 0 ||
      (field.selected_options?.length ?? 0) > 0 ||
      !!field.selected_option
    );
    if (!hasListValues && (!field.value || (typeof field.value === 'string' && field.value.trim() === ''))) {
      return 'customFieldsList.empty';
    }

    // Based on data type, format the value appropriately
    switch (field.data_type) {
      case 'date':
        if (field.value_date) {
          return formatCalendarDate(field.value_date);
        }
        return String(field.value);
      case 'datetime':
        if (field.value_datetime) {
          return new Date(field.value_datetime).toLocaleString();
        }
        return String(field.value);
      case 'time':
        if (field.value_time) {
          return field.value_time;
        }
        return String(field.value);
      case 'url':
        if (field.value_url) {
          return field.value_url;
        }
        return String(field.value);
      case 'list': {
        const labels = getListLabels(field)
        return labels.length > 0 ? labels.join(', ') : 'customFieldsList.empty'
      }
      case 'number':
        if (field.value_number !== null && field.value_number !== undefined) {
          return field.value_number.toString();
        }
        return String(field.value);
      case 'bool':
        // For boolean fields, return the boolean value to be handled in render
        return field.value_bool;
      case 'image':
        // For image fields, return the URL to be handled in render
        return String(field.value);
      default:
        return String(field.value);
    }
  };

  const renderValue = (field: CustomFieldDocument) => {
    const value = formatValue(field);
    
    // Special handling for boolean fields
    if (field.data_type === 'bool') {
      const isChecked = field.value_bool === true;
      return (
        <div className="flex items-center">
          <div className={`
            relative inline-flex h-3 w-6 items-center rounded-full transition-colors
            ${isChecked ? 'bg-[#4464f7]' : 'bg-gray-300'}
          `}>
            <span className={`
              inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
              ${isChecked ? 'translate-x-3' : 'translate-x-0.5'}
            `} />
          </div>
        </div>
      );
    }
    
    // Special handling for image fields
    if (field.data_type === 'image') {
      const imageUrl = String(value);
      if (imageUrl && imageUrl !== 'customFieldsList.empty') {
        return (
          <div className="flex items-center gap-1.5">
            <img 
              src={imageUrl} 
              alt={field.name || t('customFieldsList.image')}
              className="w-8 h-8 object-cover rounded border border-gray-200 hover:cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedImage({ url: imageUrl, name: field.name || t('customFieldsList.image') });
                setImageDialogOpen(true);
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xs text-gray-600 hidden">
              {t('customFieldsList.errorLoadingImage')}
            </span>
          </div>
        );
      }
      return (
        <span className="text-xs text-gray-600">
          {t('customFieldsList.noImage')}
        </span>
      );
    }

    // Special handling for list fields (single or multi select) — chips instead of comma text
    if (field.data_type === 'list') {
      const labels = getListLabels(field);
      if (labels.length === 0) {
        return <span className="text-xs text-gray-600">{t('customFieldsList.empty')}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {labels.map((label, i) => (
            <Badge
              key={`${label}-${i}`}
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0 font-normal"
            >
              {label}
            </Badge>
          ))}
        </div>
      );
    }

    // Special handling for rating fields — compact stars + "X de Y"
    if (field.question_type === QUESTION_TYPE.rating) {
      const current = field.value_number ?? 0;
      const max = field.max_value ?? 5;
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: max }, (_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < current ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {t('customFieldsList.ratingOutOf', { value: current, max })}
          </span>
        </div>
      );
    }

    // Special handling for file fields without a real image preview — icon + filename
    if (field.question_type === QUESTION_TYPE.fileUpload && field.data_type !== 'image') {
      const fileName = typeof value === 'string' && value !== 'customFieldsList.empty' ? value : null;
      if (!fileName) {
        return <span className="text-xs text-gray-600">{t('customFieldsList.empty')}</span>;
      }
      return (
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <FileIcon className="size-3 shrink-0" />
          <span className="break-words line-clamp-2">{fileName}</span>
        </span>
      );
    }

    // For non-boolean and non-image fields, return text with proper overflow handling
    const textValue = typeof value === 'string' && value === 'customFieldsList.empty' ? t('customFieldsList.empty') : String(value);
    return (
      <span 
        className="text-xs text-gray-600 break-words line-clamp-2" 
        title={textValue.length > 50 ? textValue : undefined}
      >
        {textValue}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with Refresh and Add buttons — fijo, no scrollea con la lista */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('customFieldsList.title')}</h4>
        <div className="flex gap-1">
          <HuemulButton
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            icon={RefreshCw}
            iconClassName="h-3 w-3"
            tooltip={t('customFieldsList.refreshCustomFields')}
            loading={isRefreshing}
            onClick={onRefresh}
          />
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAdd}
              className="h-7 w-7 p-0 hover:cursor-pointer"
              title={t('customFieldsList.addCustomField')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Fields List */}
      <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-1.5 px-3 pb-2">
        {customFields.map((field) => {
          const isUploadingThisField = uploadingImageFieldId === field.id;
          return (
            <div key={field.id} className="flex items-start justify-between p-2 border rounded bg-card">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-medium text-foreground break-words line-clamp-2" title={field.name || t('customFieldsList.unknownField')}>
                      {field.name || t('customFieldsList.unknownField')}
                    </span>
                    {field.required && (
                      <span className="text-xs text-destructive shrink-0">*</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {field.from_template && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 font-normal"
                        title={t('custom-fields:badges.fromTemplateTooltip')}
                      >
                        {t('custom-fields:badges.fromTemplate')}
                      </Badge>
                    )}
                    {field.source && (
                      <span className="text-xs text-muted-foreground">
                        {t(`custom-fields:sources.${field.source}`, { defaultValue: field.source })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 min-w-0">
                  {isUploadingThisField && field.data_type === 'image' ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{t('customFieldsList.uploadingImage')}</span>
                    </div>
                  ) : (
                    renderValue(field)
                  )}
                </div>
              </div>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hover:cursor-pointer h-5 w-5 p-0 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => {
                      setTimeout(() => {
                        onEditContent(field)
                      }, 0)
                    }} className="hover:cursor-pointer">
                      <Edit2 className="mr-2 h-3 w-3" />
                      {t('customFieldsList.editContent')}
                    </DropdownMenuItem>
                    {field.source === "inferred" && (
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onEdit(field)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Edit2 className="mr-2 h-3 w-3" />
                        {t('customFieldsList.editConfiguration')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => {
                      setTimeout(() => {
                        onDelete(field)
                      }, 0)
                    }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" />
                      {t('common:delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
      </ScrollArea>

      {/* Pagination footer — fijo, fuera del scroll area, banda gris a sangre */}
      {onPageChange && page !== undefined && pageSize !== undefined && (
        <div className="shrink-0 border-t border-border bg-muted/50 px-3 py-2">
          <HuemulPagination
            variant="bare"
            labelPosition="start"
            showFirstLast={false}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            hasNext={hasNext}
            hasPrevious={page > 1}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Image preview dialog */}
      <ImagePreviewDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        image={selectedImage}
      />
    </div>
  );
}
