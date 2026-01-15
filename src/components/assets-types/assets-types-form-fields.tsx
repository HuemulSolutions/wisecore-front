import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/color-picker';

interface DocumentTypeFormFieldsProps {
  name: string;
  color: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  errors?: {
    name?: string;
    color?: string;
  };
  disabled?: boolean;
}

export default function DocumentTypeFormFields({
  name,
  color,
  onNameChange,
  onColorChange,
  errors = {},
  disabled = false,
}: DocumentTypeFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Asset Type Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter asset type name"
          className={errors.name ? 'border-destructive' : ''}
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
          <ColorPicker
            value={color}
            onChange={onColorChange}
          />
        </div>
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color}</p>
        )}
      </div>
    </div>
  );
}
