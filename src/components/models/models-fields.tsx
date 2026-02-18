import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface DualNameFieldsProps {
  displayName: string
  technicalName: string
  onDisplayNameChange: (name: string) => void
  onTechnicalNameChange: (name: string) => void
  displayNameLabel?: string
  technicalNameLabel?: string
  displayNamePlaceholder?: string
  technicalNamePlaceholder?: string
  technicalNameDescription?: string
  disabled?: boolean
  errors?: Record<string, string>
}

export default function DualNameFields({
  displayName,
  technicalName,
  onDisplayNameChange,
  onTechnicalNameChange,
  displayNameLabel = "Display Name *",
  technicalNameLabel = "Technical Name *",
  displayNamePlaceholder = "e.g. GPT-4 Turbo",
  technicalNamePlaceholder = "e.g., gpt-4-turbo-preview",
  technicalNameDescription = "Use the exact name as specified by the provider's API documentation.",
  disabled = false,
  errors = {}
}: DualNameFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="displayName">{displayNameLabel}</Label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder={displayNamePlaceholder}
          required
          disabled={disabled}
        />
        {errors.displayName && (
          <p className="text-xs text-red-600">{errors.displayName}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="technicalName">{technicalNameLabel}</Label>
        <Input
          id="technicalName"
          name="technicalName"
          value={technicalName}
          onChange={(e) => onTechnicalNameChange(e.target.value)}
          placeholder={technicalNamePlaceholder}
          required
          disabled={disabled}
        />
        {technicalNameDescription && (
          <p className="text-xs text-gray-500">
            {technicalNameDescription}
          </p>
        )}
        {errors.technicalName && (
          <p className="text-xs text-red-600">{errors.technicalName}</p>
        )}
      </div>
    </div>
  )
}
