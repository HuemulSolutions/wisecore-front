import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Plus } from "lucide-react"
import { usePermissions, useRoleMutations, useRoles } from "@/hooks/useRbac"
import PermissionSelector from "./roles-permission-selector"
import RoleFormFields from "./roles-form-fields"
import type { CreateRoleSheetProps } from '@/types/roles'
export type { CreateRoleSheetProps } from '@/types/roles'

export default function CreateRoleSheet({ open, onOpenChange, canCreate, onCreated }: CreateRoleSheetProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [permissions, setPermissions] = useState<string[]>([])
  const [isPosition, setIsPosition] = useState(false)
  const [parentRoleId, setParentRoleId] = useState<string | null>(null)

  // Only fetch permissions when the sheet is actually open y hay permiso de listar el catálogo
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions(open && canCreate)
  const { data: rolesResponse } = useRoles(open && canCreate, 1, 1000)
  const { createRole } = useRoleMutations()

  const availablePermissions = Array.isArray(permissionsResponse?.data) ? permissionsResponse.data : []
  const positionRoleOptions = (rolesResponse?.data ?? []).filter((r) => r.is_position)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
      })
      setPermissions([])
      setIsPosition(false)
      setParentRoleId(null)
    }
  }, [open])

  if (!canCreate) return null

  const handleSubmit = async (): Promise<void> => {
    if (!canCreate) return
    await new Promise<void>((resolve, reject) => {
      createRole.mutate({
        name: formData.name,
        description: formData.description,
        permissions,
        is_position: isPosition,
        parent_role_id: isPosition ? parentRoleId : null,
      }, {
        onSuccess: (role) => {
          // El id sólo llega si el backend devolvió el rol creado; sin él no
          // hay nada que consumir aguas arriba, pero el guardado sí fue exitoso.
          if (role?.id) onCreated?.(role)
          resolve()
        },
        onError: (error) => reject(error),
      })
    })
  }

  // const isLoading = createRole.isPending

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('roles:create.title')}
      description={t('roles:create.description')}
      icon={Plus}
      maxWidth="w-full sm:max-w-[90vw] lg:max-w-[800px]"
      showCancelButton={false}
      extraActions={[{
        label: t('common:cancel'),
        variant: "outline",
        position: "header",
        onClick: () => onOpenChange(false),
      }]}
      saveAction={{
        label: t('roles:create.button'),
        onClick: handleSubmit,
        disabled: !formData.name.trim() || !formData.description.trim(),
        position: "header",
      }}
    >
      <div className="space-y-6 py-2">
        <RoleFormFields
          name={formData.name}
          description={formData.description}
          onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
          isPosition={isPosition}
          onIsPositionChange={setIsPosition}
          parentRoleId={parentRoleId}
          onParentRoleIdChange={setParentRoleId}
          positionRoleOptions={positionRoleOptions}
        />

        <PermissionSelector
          permissions={availablePermissions}
          selectedPermissions={permissions}
          onPermissionsChange={setPermissions}
          isLoading={permissionsLoading}
        />
      </div>
    </HuemulSheet>
  )
}