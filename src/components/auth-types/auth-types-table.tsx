import { Pencil, Trash2, Shield, KeyRound, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { AuthType } from "@/services/auth-types"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import { Badge } from "@/components/ui/badge"
import { AuthMethodBadge } from "@/components/auth/auth-method-badge"
import type { AuthTypesTableProps } from '@/types/auth-types'

export type { AuthTypesTableProps } from '@/types/auth-types'

const MAX_VISIBLE_DOMAINS = 2

export function AuthTypesTable({
  authTypes,
  onEdit,
  onDelete,
  isLoading = false,
  isFetching = false,
  pagination,
  canManage = false,
}: AuthTypesTableProps) {
  const { t } = useTranslation(['auth-types', 'common'])

  // Todas las filas son de la organización activa (el backend no entrega otras a
  // nadie, tampoco al root admin), así que no hay columna de ámbito.
  // La `internal` de cada organización la crea el backend y es de solo lectura (PUT/DELETE → 403).
  const isReadOnly = (authType: AuthType) => authType.type === 'internal'

  const columns: HuemulTableColumn<AuthType>[] = [
    {
      key: "name",
      label: t('common:name'),
      render: (authType) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">{authType.name}</span>
          {isReadOnly(authType) && (
            <Badge variant="outline" className="gap-1 text-[10px]" title={t('fields.internalHint')}>
              <Lock className="h-3 w-3" aria-hidden />
              {t('badges.readOnly')}
            </Badge>
          )}
        </span>
      )
    },
    {
      key: "type",
      label: t('columns.type'),
      render: (authType) => (
        <AuthMethodBadge type={authType.type} name={t(`types.${authType.type}`, { defaultValue: authType.type })} />
      )
    },
    {
      key: "domains",
      label: t('columns.domains'),
      render: (authType) => {
        const domains = authType.email_domains ?? []
        if (domains.length === 0) return <span className="text-xs text-muted-foreground">—</span>
        const visible = domains.slice(0, MAX_VISIBLE_DOMAINS)
        const rest = domains.length - visible.length
        return (
          <span className="flex flex-wrap gap-1" title={domains.join(', ')}>
            {visible.map((domain) => (
              <Badge key={domain} variant="secondary" className="text-[10px]">{domain}</Badge>
            ))}
            {rest > 0 && <Badge variant="outline" className="text-[10px]">+{rest}</Badge>}
          </span>
        )
      }
    },
    {
      key: "status",
      label: t('columns.status'),
      render: (authType) => (
        <Badge variant={authType.is_active ? 'default' : 'outline'} className="text-[10px]">
          {authType.is_active ? t('status.active') : t('status.inactive')}
        </Badge>
      )
    },
    {
      key: "secret",
      label: t('columns.secret'),
      render: (authType) => {
        if (authType.type === 'internal') return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span
            className={authType.has_client_secret ? 'inline-flex items-center gap-1 text-xs text-foreground' : 'inline-flex items-center gap-1 text-xs text-amber-700'}
            title={authType.has_client_secret ? t('secret.configured') : t('secret.missing')}
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            {authType.has_client_secret ? t('secret.configured') : t('secret.missing')}
          </span>
        )
      }
    },
  ]

  const actions: HuemulTableAction<AuthType>[] = canManage ? [
    {
      key: "edit",
      label: t('actions.editAuthType'),
      icon: Pencil,
      onClick: onEdit,
      show: (authType) => !isReadOnly(authType),
      separator: true
    },
    {
      key: "delete",
      label: t('actions.deleteAuthType'),
      icon: Trash2,
      onClick: onDelete,
      show: (authType) => !isReadOnly(authType),
      destructive: true
    }
  ] : []

  return (
    <HuemulTable
      data={authTypes}
      columns={columns}
      actions={actions}
      getRowKey={(authType) => authType.id}
      emptyState={{
        icon: Shield,
        title: t('emptyState.empty'),
        description: t('emptyState.noResults'),
      }}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
    />
  )
}
