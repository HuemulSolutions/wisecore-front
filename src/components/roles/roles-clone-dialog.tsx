import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { type Role } from "@/services/rbac"
import type { CloneRoleDialogProps } from '@/types/roles-clone-dialog'
export type { CloneRoleDialogProps } from '@/types/roles-clone-dialog'

export function CloneRoleDialog({ open, onOpenChange, role, onConfirm }: CloneRoleDialogProps) {
  const { t } = useTranslation('roles')
  const [copyUsers, setCopyUsers] = useState(false)

  const handleConfirm = async () => {
    await onConfirm(copyUsers)
    setCopyUsers(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCopyUsers(false)
    }
    onOpenChange(isOpen)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('clone.title')}
      description={t('clone.description', { name: role?.name })}
      icon={Copy}
      saveAction={{
        label: t('clone.button'),
        onClick: handleConfirm,
        icon: Copy,
      }}
    >
      <div className="py-2">
        <HuemulField
          type="switch"
          label={t('clone.copyUsers')}
          description={t('clone.copyUsersDescription')}
          value={copyUsers}
          onChange={(val) => setCopyUsers(val as boolean)}
        />
      </div>
    </HuemulDialog>
  )
}
