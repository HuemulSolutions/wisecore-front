"use client"

/**
 * Método de autenticación del usuario en la organización activa, para /users
 * (lista y tab Perfil). Envuelve `MembershipAuthMethodSelect` y guarda con
 * `PATCH /organizations/{org}/users/{user}/auth-method` — el método es de la
 * membresía (docs/sso-frontend.md, Fase 6), no del usuario: cambiarlo acá no
 * afecta su login en otras organizaciones.
 *
 * Solo se muestra cuando el usuario viene de `GET /user_roles/users_with_roles`,
 * que trae `auth_type` de la membresía. El fallback de deep-link
 * (`GET /users/{id}`) trae solo el `auth_type_id` legacy del usuario, que ya no
 * es el método de login: ahí no se muestra nada antes que un valor engañoso.
 */
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { MembershipAuthMethodSelect } from "@/components/organization/membership-auth-method-select"
import { useAuth } from "@/contexts/auth-context"
import { useSetMembershipAuthMethod } from "@/hooks/useOrganizations"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { User } from "@/types/users"

export interface UserAuthMethodFieldProps {
  user: User
  organizationId: string
  /** Root admin o admin de la organización activa (misma regla que el backend). */
  canEdit: boolean
  /** Label + descripción (tab Perfil). Sin label queda compacto para la fila de la tabla. */
  withLabel?: boolean
  className?: string
}

export function UserAuthMethodField({
  user,
  organizationId,
  canEdit,
  withLabel = false,
  className,
}: UserAuthMethodFieldProps) {
  const { t } = useTranslation(["users", "auth"])
  const { user: currentUser } = useAuth()
  const { isRootAdmin } = useUserPermissions()
  const mutation = useSetMembershipAuthMethod()
  const [pending, setPending] = useState<{ authTypeId: string; type: string | undefined } | null>(null)

  if (user.auth_type === undefined) return null

  // El propio método se puede cambiar. Solo se confirma el caso que puede dejar
  // afuera al admin: pasarse a una conexión SSO sin ser root admin (el root
  // admin no pasa por la política de método por membresía al pedir el token de
  // organización, y pasar a código por email nunca bloquea a nadie).
  const isSelf = !!currentUser && currentUser.id === user.id
  const handleChange = (authTypeId: string, type: string | undefined) => {
    if (isSelf && !isRootAdmin && type !== "internal") {
      setPending({ authTypeId, type })
      return
    }
    mutation.mutate({ organizationId, userId: user.id, authTypeId })
  }

  const field = (
    <MembershipAuthMethodSelect
      organizationId={organizationId}
      value={user.auth_type_id}
      current={user.auth_type}
      canEdit={canEdit}
      disabled={mutation.isPending}
      label={withLabel ? t("users:organizations.authMethod") : undefined}
      description={withLabel ? t("users:detail.authMethodDescription") : undefined}
      onChange={handleChange}
      className={className}
    />
  )

  const provider = pending?.type
    ? t(`auth:methods.${pending.type}`, { defaultValue: pending.type })
    : ""

  const confirmDialog = (
    <HuemulAlertDialog
      open={!!pending}
      onOpenChange={(open) => { if (!open) setPending(null) }}
      title={t("users:detail.authMethodSelfTitle")}
      description={t("users:detail.authMethodSelfDescription", { provider })}
      actionLabel={t("users:detail.authMethodSelfConfirm")}
      actionVariant="default"
      onAction={async () => {
        if (!pending) return
        await mutation.mutateAsync({ organizationId, userId: user.id, authTypeId: pending.authTypeId })
        setPending(null)
      }}
    />
  )

  // En solo lectura el select se vuelve un badge sin label: en el tab Perfil se
  // lo pone igual que el resto de los campos de solo lectura.
  if (withLabel && !canEdit) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-primary/70">{t("users:organizations.authMethod")}</span>
        <div>{field}</div>
      </div>
    )
  }

  return (
    <>
      {field}
      {confirmDialog}
    </>
  )
}
