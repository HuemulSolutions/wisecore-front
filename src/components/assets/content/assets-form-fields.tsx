import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { isRootAdmin } from '@/lib/jwt-utils';

interface AssetFormFieldsProps {
  name: string;
  description: string;
  internalCode: string;
  templateId: string;
  documentTypeId: string;
  createInitialVersion: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInternalCodeChange: (value: string) => void;
  onTemplateIdChange: (value: string) => void;
  onDocumentTypeIdChange: (value: string) => void;
  onCreateInitialVersionChange: (value: boolean) => void;
  onCreateDocType?: () => void;
  templates: any[];
  documentTypes: any[];
  isLoadingDocTypes?: boolean;
  docTypesError?: any;
  disabled?: boolean;
}

export default function AssetFormFields({
  name,
  description,
  internalCode,
  templateId,
  documentTypeId,
  createInitialVersion,
  onNameChange,
  onDescriptionChange,
  onInternalCodeChange,
  onTemplateIdChange,
  onDocumentTypeIdChange,
  onCreateInitialVersionChange,
  onCreateDocType,
  templates,
  documentTypes,
  isLoadingDocTypes = false,
  docTypesError = null,
  disabled = false,
}: AssetFormFieldsProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Asset Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter asset name"
          required
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="internalCode">Internal Code (Optional)</Label>
        <Input
          id="internalCode"
          name="internalCode"
          value={internalCode}
          onChange={(e) => onInternalCodeChange(e.target.value)}
          placeholder="Enter internal code"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter asset description"
          rows={4}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="template">Template (Optional)</Label>
        <Select
          value={templateId}
          onValueChange={(value) => {
            onTemplateIdChange(value)
            // If a template is selected, disable create_initial_version
            if (value) {
              onCreateInitialVersionChange(false)
            }
          }}
          disabled={disabled || createInitialVersion}
        >
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Select template (optional)" />
          </SelectTrigger>
          <SelectContent>
            {templates.length > 0 ? (
              templates.map((template: any) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No templates available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="createInitialVersion">Create initial version</Label>
          <p className="text-sm text-muted-foreground">
            Creates the asset with an initial section ready to write.{templateId ? ' Not available when a template is selected.' : ''}
          </p>
        </div>
        <Switch
          id="createInitialVersion"
          checked={createInitialVersion}
          onCheckedChange={(checked) => {
            onCreateInitialVersionChange(checked)
            // If enabling initial version, clear template selection
            if (checked) {
              onTemplateIdChange('')
            }
          }}
          disabled={disabled || !!templateId}
          className="hover:cursor-pointer"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="documentType">Asset Type *</Label>
          {isRootAdmin() && onCreateDocType && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCreateDocType}
              className="h-auto py-1 px-2 text-xs hover:cursor-pointer"
              disabled={disabled}
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              New type
            </Button>
          )}
        </div>
        <Select value={documentTypeId} onValueChange={onDocumentTypeIdChange} disabled={disabled}>
          <SelectTrigger id="documentType" className="w-full">
            <SelectValue placeholder="Select asset type" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingDocTypes ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                Loading asset types...
              </div>
            ) : docTypesError ? (
              <div className="px-2 py-2 text-sm text-red-500">
                Error loading asset types
              </div>
            ) : documentTypes.length > 0 ? (
              documentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    {type.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    {type.name}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No asset types available with creation permissions
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
