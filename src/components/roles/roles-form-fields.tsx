import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"

interface RoleFormFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  includeTextarea?: boolean
}

export default function RoleFormFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameLabel,
  descriptionLabel,
  includeTextarea = true
}: RoleFormFieldsProps) {
  const { t } = useTranslation('roles')
  return (
    <div className="grid grid-cols-1 gap-4">
      <HuemulField
        label={nameLabel ?? t('form.roleName')}
        value={name}
        onChange={(v) => onNameChange(String(v))}
        placeholder={t('form.roleNamePlaceholder')}
        required
      />
      <HuemulField
        type={includeTextarea ? "textarea" : "text"}
        label={descriptionLabel ?? t('form.description')}
        value={description}
        onChange={(v) => onDescriptionChange(String(v))}
        placeholder={t('form.descriptionPlaceholder')}
        rows={3}
        required
      />
    </div>
  )
}
