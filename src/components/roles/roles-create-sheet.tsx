import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Plus } from "lucide-react"
import { usePermissions, useRoleMutations } from "@/hooks/useRbac"
import PermissionSelector from "./roles-permission-selector"
import RoleFormFields from "./roles-form-fields"

interface CreateRoleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateRoleSheet({ open, onOpenChange }: CreateRoleSheetProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [permissions, setPermissions] = useState<string[]>([])
  
  // Only fetch permissions when the sheet is actually open
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions(open)
  const { createRole } = useRoleMutations()

  const availablePermissions = Array.isArray(permissionsResponse?.data) ? permissionsResponse.data : []

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
      })
      setPermissions([])
    }
  }, [open])

  const handleSubmit = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      createRole.mutate({
        name: formData.name,
        description: formData.description,
        permissions,
      }, {
        onSuccess: () => resolve(),
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