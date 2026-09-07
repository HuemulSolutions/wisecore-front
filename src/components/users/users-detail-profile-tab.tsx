"use client"

import { useTranslation } from "react-i18next"
import { Building2, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import UserFormFields from "./users-form-fields"
import { formatDate, getStatusColor } from "./users-table"
import type { User, UserProfileFormApi } from "@/types/users"
import type { useUserMutations } from "@/hooks/useUsers"

export interface UsersDetailProfileTabProps {
  user: User
  form: UserProfileFormApi
  userMutations: ReturnType<typeof useUserMutations>
  canUpdate: boolean
  canManageRootAdmin: boolean
}

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-primary/70">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  )
}

/**
 * Tab "Perfil": nombre/apellido/email(ro)/cumpleaños/foto editables inline
 * (con `HuemulPanelSaveBar` en `UserDetailPanel`) — reemplaza a
 * `EditUserSheet` en /users, mismo patrón que `RolesDetailDetailsTab`. Status
 * y fecha de activación quedan de solo lectura (no forman parte de
 * `UpdateUserData`). Aprobar/rechazar y el switch de admin root son acciones
 * inmediatas, separadas del formulario por un divisor.
 */
export function UsersDetailProfileTab({
  user,
  form,
  userMutations,
  canUpdate,
  canManageRootAdmin,
}: UsersDetailProfileTabProps) {
  const { t } = useTranslation(["users", "common"])
  const birthday = user.birth_day && user.birth_month
    ? `${t(`users:form.months.${MONTH_KEYS[user.birth_month - 1]}`)} ${user.birth_day}`
    : "—"

  return (
    <div className="flex flex-col gap-5 p-4">
      {canUpdate ? (
        <UserFormFields
          name={form.name}
          lastName={form.lastName}
          email={form.email}
          birthDay={form.birthDay}
          birthMonth={form.birthMonth}
          onNameChange={form.setName}
          onLastNameChange={form.setLastName}
          onEmailChange={() => {}}
          onBirthDayChange={form.setBirthDay}
          onBirthMonthChange={form.setBirthMonth}
          onFileChange={form.onFileChange}
          includeBirthday
          includePhoto
          disabled={form.isSaving}
          errors={form.errors}
          emailReadOnly
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Field label={t("users:form.firstName")} value={user.name} />
          <Field label={t("users:form.lastName")} value={user.last_name} />
          <Field label={t("common:email")} value={user.email} />
          <Field label={t("users:columns.birthday")} value={birthday} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Field
          label={t("common:status")}
          value={
            <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
              {t(`common:${user.status}`, { defaultValue: user.status })}
            </Badge>
          }
        />
        <Field
          label={t("users:detail.activatedLabel")}
          value={user.activated_at ? formatDate(user.activated_at) : "—"}
        />
      </div>

      {user.status === "pending" && canUpdate && (
        <div className="flex gap-2">
          <HuemulButton
            variant="outline"
            size="sm"
            icon={Check}
            label={t("users:actions.approveUser")}
            className="text-green-600"
            onClick={() => userMutations.approveUser.mutate(user.id)}
          />
          <HuemulButton
            variant="outline"
            size="sm"
            icon={X}
            label={t("users:actions.rejectUser")}
            className="text-destructive"
            onClick={() => userMutations.rejectUser.mutate(user.id)}
          />
        </div>
      )}

      {canManageRootAdmin ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            {t("users:detail.rootAdminSection")}
          </span>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t("users:rootAdmin.warningMessage")}
            </AlertDescription>
          </Alert>
          <HuemulField
            type="switch"
            label={t("users:rootAdmin.switchLabel")}
            description={t("users:rootAdmin.switchDescription")}
            value={user.is_root_admin || false}
            onChange={(v) =>
              userMutations.updateRootAdmin.mutate({ userId: user.id, isRootAdmin: Boolean(v) })
            }
            disabled={userMutations.updateRootAdmin.isPending}
            labelFirst
            className="rounded-lg border p-4"
          />
        </div>
      ) : (
        user.is_root_admin && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Building2 className="size-3" />
            {t("users:rootAdmin.isRootAdmin")}
          </div>
        )
      )}
    </div>
  )
}
