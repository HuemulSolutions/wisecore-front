import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Copy } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { CloneRoleDialogProps } from '@/types/roles'
export type { CloneRoleDialogProps } from '@/types/roles'

export function CloneRoleDialog({ open, onOpenChange, role, onConfirm, canClone }: CloneRoleDialogProps) {
  const { t } = useTranslation('roles')
  const [copyUsers, setCopyUsers] = useState(false)

  const handleConfirm = async () => {
    if (!canClone) return
    await onConfirm(copyUsers)
    setCopyUsers(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCopyUsers(false)
    }
    onOpenChange(isOpen)
  }

  if (!canClone) return null

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
