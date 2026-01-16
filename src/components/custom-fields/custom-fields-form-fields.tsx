import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomFieldFormFieldsProps {
  name: string;
  description: string;
  dataType: string;
  masc: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDataTypeChange: (value: string) => void;
  onMascChange: (value: string) => void;
  dataTypes: string[];
  formatDataType: (dataType: string) => string;
  errors?: {
    name?: string;
    description?: string;
    data_type?: string;
  };
  disabled?: boolean;
  loadingDataTypes?: boolean;
}

export default function CustomFieldFormFields({
  name,
  description,
  dataType,
  masc,
  onNameChange,
  onDescriptionChange,
  onDataTypeChange,
  onMascChange,
  dataTypes,
  formatDataType,
  errors = {},
  disabled = false,
  loadingDataTypes = false,
}: CustomFieldFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter custom field name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter custom field description"
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Data Type */}
      <div className="space-y-2">
        <Label htmlFor="data_type">Data Type</Label>
        <Select
          value={dataType}
          onValueChange={onDataTypeChange}
          disabled={disabled || loadingDataTypes}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select data type" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatDataType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.data_type && (
          <p className="text-sm text-destructive">{errors.data_type}</p>
        )}
      </div>

      {/* Mask */}
      <div className="space-y-2">
        <Label htmlFor="masc">Mask (Optional)</Label>
        <Input
          id="masc"
          placeholder="Enter input mask (e.g., ###-##-####)"
          value={masc}
          onChange={(e) => onMascChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
