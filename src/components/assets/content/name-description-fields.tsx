import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "react-i18next"

interface NameDescriptionFieldsProps {
  name: string
  description?: string
  onNameChange: (name: string) => void
  onDescriptionChange?: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  namePlaceholder?: string
  descriptionPlaceholder?: string
  includeDescription?: boolean
  useTextarea?: boolean
  nameRequired?: boolean
  descriptionRequired?: boolean
  disabled?: boolean
  nameError?: string
  descriptionError?: string
}

export default function NameDescriptionFields({
  name,
  description = '',
  onNameChange,
  onDescriptionChange,
  nameLabel,
  descriptionLabel,
  namePlaceholder,
  descriptionPlaceholder,
  includeDescription = true,
  useTextarea = false,
  nameRequired = true,
  descriptionRequired = false,
  disabled = false,
  nameError,
  descriptionError
}: NameDescriptionFieldsProps) {
  const { t } = useTranslation('assets');
  const resolvedNameLabel = nameLabel ?? t('nameDescriptionDefaults.nameLabel');
  const resolvedDescriptionLabel = descriptionLabel ?? t('nameDescriptionDefaults.descriptionLabel');
  const resolvedNamePlaceholder = namePlaceholder ?? t('nameDescriptionDefaults.namePlaceholder');
  const resolvedDescriptionPlaceholder = descriptionPlaceholder ?? t('nameDescriptionDefaults.descriptionPlaceholder');
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{resolvedNameLabel}</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={resolvedNamePlaceholder}
          required={nameRequired}
          disabled={disabled}
        />
        {nameError && (
          <p className="text-xs text-red-600">{nameError}</p>
        )}
      </div>

      {includeDescription && onDescriptionChange && (
        <div className="grid gap-2">
          <Label htmlFor="description">{resolvedDescriptionLabel}</Label>
          {useTextarea ? (
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={resolvedDescriptionPlaceholder}
              required={descriptionRequired}
              disabled={disabled}
              rows={3}
            />
          ) : (
            <Input
              id="description"
              name="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={resolvedDescriptionPlaceholder}
              required={descriptionRequired}
              disabled={disabled}
            />
          )}
          {descriptionError && (
            <p className="text-xs text-red-600">{descriptionError}</p>
          )}
        </div>
      )}
    </div>
  )
}
