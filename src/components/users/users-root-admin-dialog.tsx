import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Shield } from "lucide-react"
import { type User } from "@/types/users"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface RootAdminDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (userId: string, isRootAdmin: boolean) => void
  isLoading?: boolean
}

export default function RootAdminDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: RootAdminDialogProps) {
  const { t } = useTranslation(['users'])
  const [isRootAdmin, setIsRootAdmin] = useState(false)

  // Reset when dialog opens/closes or user changes
  useEffect(() => {
    if (user && open) {
      setIsRootAdmin(user.is_root_admin || false)
    }
  }, [user, open])

  const handleSave = () => {
    if (user) onConfirm(user.id, isRootAdmin)
  }

  if (!user) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users:rootAdmin.title')}
      description={t('users:rootAdmin.description', { name: `${user.name} ${user.last_name}` })}
      icon={Shield}
      maxWidth="sm:max-w-md"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: t('users:rootAdmin.updateButton'),
        onClick: handleSave,
        loading: isLoading,
        closeOnSuccess: false
      }}
    >
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
          {t('users:rootAdmin.warningMessage')}
          </AlertDescription>
        </Alert>

        <HuemulField
          type="switch"
          label={t('users:rootAdmin.switchLabel')}
          description={t('users:rootAdmin.switchDescription')}
          value={isRootAdmin}
          onChange={(v) => setIsRootAdmin(Boolean(v))}
          disabled={isLoading}
          labelFirst
          className="p-4 border rounded-lg"
        />

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">{t('users:rootAdmin.currentStatus')}</p>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            <span>
              {user.is_root_admin ? t('users:rootAdmin.isRootAdmin') : t('users:rootAdmin.isRegularUser')}
            </span>
          </div>
        </div>
      </div>
    </HuemulDialog>
  )
}
