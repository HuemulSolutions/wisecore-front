/**
 * Método de autenticación de una membresía (docs/sso-frontend.md, Fase 6).
 *
 * El método es por usuario + organización y lo fija el admin: acá se muestra
 * (badge) y, con `canEdit`, se cambia con un select de las conexiones
 * elegibles para ESA organización (`INTERNAL`, globales activas o propias de la
 * organización, misma regla que `validate_connection_for_organization` en el
 * backend). `value === null` significa "sin método explícito" y se muestra como
 * la conexión interna (código por email), que es lo que el backend aplica.
 */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { HuemulField } from "@/huemul/components/huemul-field"
import { AuthMethodBadge } from "@/components/auth/auth-method-badge"
import { useEligibleAuthTypes } from "@/hooks/useAuthTypes"
import type { MembershipAuthType } from "@/types/organizations"

export interface MembershipAuthMethodSelectProps {
  /** Organización de la membresía: define qué conexiones son elegibles. */
  organizationId: string
  /** `auth_type_id` actual; `null` = método por defecto (código por email). */
  value: string | null | undefined
  /** Conexión actual tal como la devolvió el backend (para mostrarla aunque ya no sea elegible). */
  current?: MembershipAuthType | null
  /** `type` es el de la conexión elegida (`internal`, `microsoft`, …), para decidir confirmaciones. */
  onChange?: (authTypeId: string, type: string | undefined) => void
  canEdit?: boolean
  disabled?: boolean
  /** Label del campo (solo en modo edición). Sin label queda compacto para filas. */
  label?: string
  description?: string
  className?: string
  /** Texto de la opción interna cuando se usa como "por defecto" (tab Detalles). */
  internalLabel?: string
}

export function MembershipAuthMethodSelect({
  organizationId,
  value,
  current,
  onChange,
  canEdit = false,
  disabled = false,
  label,
  description,
  className,
  internalLabel,
}: MembershipAuthMethodSelectProps) {
  const { t } = useTranslation(["organizations", "auth", "common"])
  const { eligible, isLoading } = useEligibleAuthTypes({ organizationId, enabled: canEdit })

  const internal = useMemo(() => eligible.find((item) => item.type === "internal") ?? null, [eligible])
  const resolvedValue = value ?? current?.id ?? internal?.id ?? ""

  const providerLabel = (type: string) =>
    t(type === "internal" ? "auth:methods.email" : `auth:methods.${type}`, { defaultValue: type })

  const options = useMemo(() => {
    const list = eligible.map((item) => ({
      value: item.id,
      label: item.type === "internal" && internalLabel ? internalLabel : item.name,
      description: providerLabel(item.type),
    }))
    // La conexión actual puede estar inactiva o ser de otra organización: se
    // mantiene visible para no "perder" el valor, marcada como no elegible.
    if (current && !list.some((option) => option.value === current.id)) {
      list.push({
        value: current.id,
        label: `${current.name} (${t("organizations:detail.authMethodInactive")})`,
        description: providerLabel(current.type),
      })
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `providerLabel` solo depende de `t`
  }, [current, eligible, internalLabel, t])

  // Backend anterior al SSO: el campo no viene y no se muestra nada, tampoco en
  // edición (no hay método que mostrar y ese backend no tiene el PATCH). Los
  // callers sin membresía (default de la org, alta de miembro) pasan `null`.
  if (current === undefined && value === undefined) return null

  if (!canEdit) {
    return <AuthMethodBadge type={current?.type ?? "internal"} name={current?.name ?? null} className={className} />
  }

  return (
    <HuemulField
      type="select"
      label={label}
      name="auth_type_id"
      value={resolvedValue}
      options={options}
      onChange={(next) => {
        const id = String(next)
        if (id && id !== resolvedValue) {
          const type = eligible.find((item) => item.id === id)?.type ?? (current?.id === id ? current.type : undefined)
          onChange?.(id, type)
        }
      }}
      placeholder={isLoading ? t("common:loading") : t("organizations:detail.authMethod")}
      disabled={disabled || isLoading}
      description={description}
      className={className}
    />
  )
}
