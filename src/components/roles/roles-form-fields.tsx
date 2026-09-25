import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { RoleFormFieldsProps } from '@/types/roles'
export type { RoleFormFieldsProps } from '@/types/roles'

export default function RoleFormFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  nameLabel,
  descriptionLabel,
  includeTextarea = true,
  isPosition,
  onIsPositionChange,
  parentRoleId,
  onParentRoleIdChange,
  positionRoleOptions,
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
      <HuemulField
        type="switch"
        label={t('form.isPosition')}
        description={t('form.isPositionDescription')}
        value={isPosition}
        onChange={(v) => {
          const next = Boolean(v)
          onIsPositionChange(next)
          if (!next) onParentRoleIdChange(null)
        }}
        labelFirst
      />
      {isPosition && (
        <HuemulField
          type="combobox"
          label={t('form.parentRole')}
          placeholder={t('form.parentRolePlaceholder')}
          description={t('form.parentRoleDescription')}
          value={parentRoleId ?? ''}
          options={positionRoleOptions.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(v) => onParentRoleIdChange(v ? String(v) : null)}
        />
      )}
    </div>
  )
}
