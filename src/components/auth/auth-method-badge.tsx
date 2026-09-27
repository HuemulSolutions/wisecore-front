/**
 * Badge de método de autenticación (docs/sso-frontend.md): icono + nombre.
 * Lo comparten el selector de organización del login, el diálogo de step-up,
 * la tabla de conexiones y el badge de membresía.
 */
import { Mail, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MicrosoftLogo } from '@/components/icons/microsoft-logo'
import { GoogleLogo } from '@/components/icons/google-logo'
import { cn } from '@/lib/utils'

export interface AuthMethodBadgeProps {
  /** `internal` | `microsoft` | `google` | otro tipo OIDC. */
  type: string
  /** Nombre visible de la conexión; si falta, se usa el nombre genérico del proveedor. */
  name?: string | null
  className?: string
  /** Solo el icono (para celdas compactas). */
  iconOnly?: boolean
}

export function AuthMethodIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn('h-4 w-4 shrink-0', className)
  if (type === 'microsoft') return <MicrosoftLogo className={cls} />
  if (type === 'google') return <GoogleLogo className={cls} />
  if (type === 'internal' || type === 'internal_code') return <Mail className={cls} aria-hidden />
  return <KeyRound className={cls} aria-hidden />
}

export function AuthMethodBadge({ type, name, className, iconOnly = false }: AuthMethodBadgeProps) {
  const { t } = useTranslation('auth')
  const genericKey = type === 'internal' || type === 'internal_code' ? 'methods.email' : `methods.${type}`
  const label = name?.trim() || t(genericKey, { defaultValue: type })
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium', className)}
      title={label}
    >
      <AuthMethodIcon type={type} />
      {!iconOnly && <span className="truncate">{label}</span>}
    </span>
  )
}
