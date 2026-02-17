import { useState } from "react";
import { Plus, RefreshCw, Edit2, MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { DocumentActionButton, DocumentAccessControl } from "@/components/assets/content/assets-access-control";
import type { CustomFieldDocument } from "@/types/custom-fields-documents";

interface CustomFieldsListProps {
  customFields: CustomFieldDocument[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (field: CustomFieldDocument) => void;
  onEditContent: (field: CustomFieldDocument) => void;
  onDelete: (field: CustomFieldDocument) => void;
  onRefresh: () => void;
  uploadingImageFieldId?: string | null;
  isRefreshing?: boolean;
  accessLevels?: string[];
}

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
  accessLevels 
}: CustomFieldsListProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <Button size="sm" variant="outline" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">No custom fields available</p>
          <DocumentAccessControl
            accessLevels={accessLevels}
            requiredAccess={["edit", "create"]}
            requireAll={false}
          >
            <Button size="sm" variant="outline" onClick={onAdd} className="hover:cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DocumentAccessControl>
        </div>
      </div>
    );
  }

  const formatValue = (field: CustomFieldDocument) => {
    // If no value is set, show "Vacío"
    if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
      return 'Vacío';
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
      if (imageUrl && imageUrl !== 'Vacío') {
        return (
          <div className="flex items-center gap-1.5">
            <img 
              src={imageUrl} 
              alt={field.name || 'Image'}
              className="w-8 h-8 object-cover rounded border border-gray-200 hover:cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedImage({ url: imageUrl, name: field.name || 'Image' });
                setImageDialogOpen(true);
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xs text-gray-600 hidden">
              Error loading image
            </span>
          </div>
        );
      }
      return (
        <span className="text-xs text-gray-600">
          No image
        </span>
      );
    }
    
    // For non-boolean and non-image fields, return text with proper overflow handling
    const textValue = String(value);
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
    <div className="space-y-2 pt-2">
      {/* Header with Refresh and Add buttons */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Fields</h4>
        <div className="flex gap-1">
          <DocumentAccessControl
            accessLevels={accessLevels}
            requiredAccess="read"
          >
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRefresh} 
              disabled={isRefreshing}
              className={`hover:cursor-pointer h-7 w-7 p-0 ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Refresh custom fields"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </DocumentAccessControl>
          <DocumentActionButton
            accessLevels={accessLevels}
            requiredAccess={["edit", "create"]}
            requireAll={false}
            size="sm"
            variant="outline"
            onClick={onAdd}
            className="h-7 w-7 p-0"
            title="Add custom field"
          >
            <Plus className="h-3 w-3" />
          </DocumentActionButton>
        </div>
      </div>
      
      {/* Fields List */}
      <div className="space-y-1.5">
        {customFields.map((field) => {
          const isUploadingThisField = uploadingImageFieldId === field.id;
          return (
            <div key={field.id} className="flex items-start justify-between p-2 border rounded bg-card">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-medium text-foreground break-words line-clamp-2" title={field.name || 'Unknown Field'}>
                      {field.name || 'Unknown Field'}
                    </span>
                    {field.required && (
                      <span className="text-xs text-destructive shrink-0">*</span>
                    )}
                  </div>
                  {field.source && (
                    <span className="text-xs text-muted-foreground capitalize shrink-0">
                      {field.source}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 min-w-0">
                  {isUploadingThisField && field.data_type === 'image' ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Uploading image...</span>
                    </div>
                  ) : (
                    renderValue(field)
                  )}
                </div>
              </div>
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
                  <DocumentAccessControl
                    accessLevels={accessLevels}
                    requiredAccess="edit"
                  >
                    <DropdownMenuItem onSelect={() => {
                      setTimeout(() => {
                        onEditContent(field)
                      }, 0)
                    }} className="hover:cursor-pointer">
                      <Edit2 className="mr-2 h-3 w-3" />
                      Edit Content
                    </DropdownMenuItem>
                  </DocumentAccessControl>
                  {field.source === "inferred" && (
                    <DocumentAccessControl
                      accessLevels={accessLevels}
                      requiredAccess="edit"
                    >
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onEdit(field)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit Configuration
                      </DropdownMenuItem>
                    </DocumentAccessControl>
                  )}
                  <DropdownMenuSeparator />
                  <DocumentAccessControl
                    accessLevels={accessLevels}
                    requiredAccess="delete"
                  >
                    <DropdownMenuItem onSelect={() => {
                      setTimeout(() => {
                        onDelete(field)
                      }, 0)
                    }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DocumentAccessControl>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Image preview dialog */}
      <ReusableDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        title={selectedImage?.name || "Image Preview"}
        maxWidth="2xl"
        maxHeight="90vh"
      >
        <div className="flex justify-center">
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-h-[70vh] w-auto object-contain rounded"
            />
          )}
        </div>
      </ReusableDialog>
    </div>
  );
}
