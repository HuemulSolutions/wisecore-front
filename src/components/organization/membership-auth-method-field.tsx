"use client"

/**
 * Método de autenticación de una membresía (usuario + organización), editable.
 * Es el único punto que lo cambia: /users (lista y tab Perfil), /organizations
 * (tab Usuarios) y la tab Organizaciones del detalle de usuario. Envuelve
 * `MembershipAuthMethodSelect` y guarda con
 * `PATCH /organizations/{org}/users/{user}/auth-method` — el método es de la
 * membresía (docs/sso-frontend.md, Fase 6): cambiarlo no afecta el login del
 * usuario en otras organizaciones.
 *
 * Pasarse a sí mismo a una conexión SSO sin ser root admin pide confirmación,
 * porque puede dejar al admin sin acceso a la organización.
 *
 * No se muestra si la membresía no trae `auth_type` (backend anterior al SSO, o
 * el fallback de deep-link `GET /users/{id}`, cuyo `auth_type_id` legacy ya no
 * es el método de login): mejor nada que un valor engañoso.
 */
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { MembershipAuthMethodSelect } from "@/components/organization/membership-auth-method-select"
import { useAuth } from "@/contexts/auth-context"
import { useSetMembershipAuthMethod } from "@/hooks/useOrganizations"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { MembershipAuthType } from "@/types/organizations"

/** Lo mínimo de una membresía: sirve con `User`, `OrganizationUser` o una fila de organizaciones. */
export interface MembershipAuthMethodMember {
  /** Id del usuario de la membresía. */
  id: string
  auth_type_id?: string | null
  auth_type?: MembershipAuthType | null
}

export interface MembershipAuthMethodFieldProps {
  member: MembershipAuthMethodMember
  organizationId: string
  /** Root admin o admin de ESA organización (misma regla que el backend). */
  canEdit: boolean
  /** Bloqueo externo (p. ej. otra acción de la fila en curso). */
  disabled?: boolean
  /** Label + descripción (tab Perfil). Sin label queda compacto para filas. */
  withLabel?: boolean
  className?: string
}

export function MembershipAuthMethodField({
  member,
  organizationId,
  canEdit,
  disabled = false,
  withLabel = false,
  className,
}: MembershipAuthMethodFieldProps) {
  const { t } = useTranslation(["users", "auth"])
  const { user: currentUser } = useAuth()
  const { isRootAdmin } = useUserPermissions()
  const mutation = useSetMembershipAuthMethod()
  const [pending, setPending] = useState<{ authTypeId: string; type: string | undefined } | null>(null)

  if (member.auth_type === undefined) return null

  // El propio método se puede cambiar. Solo se confirma el caso que puede dejar
  // afuera al admin: pasarse a una conexión SSO sin ser root admin (el root
  // admin no pasa por la política de método por membresía al pedir el token de
  // organización, y pasar a código por email nunca bloquea a nadie).
  const isSelf = !!currentUser && currentUser.id === member.id
  const handleChange = (authTypeId: string, type: string | undefined) => {
    if (isSelf && !isRootAdmin && type !== "internal") {
      setPending({ authTypeId, type })
      return
    }
    mutation.mutate({ organizationId, userId: member.id, authTypeId })
  }

  const field = (
    <MembershipAuthMethodSelect
      organizationId={organizationId}
      value={member.auth_type_id}
      current={member.auth_type}
      canEdit={canEdit}
      disabled={disabled || mutation.isPending}
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
        // El cierre lo hace HuemulAlertDialog (onOpenChange(false) limpia `pending`).
        await mutation.mutateAsync({ organizationId, userId: member.id, authTypeId: pending.authTypeId })
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
