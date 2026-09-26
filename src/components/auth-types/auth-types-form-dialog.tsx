/**
 * Alta y edición de conexiones de autenticación (docs/sso-frontend.md, Fase 5).
 *
 * Un solo diálogo para `create` y `edit`: los campos dependen del tipo
 * (`microsoft` / `google`), el secreto es write-only (en edición se muestra
 * "configurado" y se envía solo si el usuario escribe uno nuevo) y el ámbito
 * Global/organización lo elige solo el root admin al crear; el org admin crea
 * siempre en su organización (el backend lo fuerza desde `X-Org-Id`).
 */
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Edit, Plus } from "lucide-react"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { Badge } from "@/components/ui/badge"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import { useOrganizationsLookup } from "@/hooks/useOrganizations"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import {
  EMPTY_AUTH_TYPE_FORM,
  buildCreateRequest,
  buildUpdateRequest,
  formValuesFromAuthType,
  parseDomainList,
  parseListInput,
  validateAuthTypeForm,
  type AuthTypeFormErrorKey,
  type AuthTypeFormValues,
} from "@/lib/auth-type-form"
import { isSsoAuthType, type AuthType, type AuthTypeKind, type AutoProvision } from "@/types/auth-types"
import type { AuthTypeFormDialogProps } from "@/types/auth-types"

export type { AuthTypeFormDialogProps } from "@/types/auth-types"

const AUTO_PROVISION_VALUES: AutoProvision[] = ['off', 'pending', 'active']

export function AuthTypeFormDialog({ open, onOpenChange, authType = null, canManage = false }: AuthTypeFormDialogProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const mode: 'create' | 'edit' = authType ? 'edit' : 'create'
  const { isRootAdmin } = useUserPermissions()
  const [values, setValues] = useState<AuthTypeFormValues>(EMPTY_AUTH_TYPE_FORM)
  const [errors, setErrors] = useState<Partial<Record<AuthTypeFormErrorKey, string>>>({})

  const { data: authTypeTypes } = useAuthTypeTypes(open && canManage)
  const { byId: organizationsById } = useOrganizationsLookup(open && canManage && isRootAdmin && mode === 'create')
  const { createAuthType, updateAuthType } = useAuthTypeMutations()

  useEffect(() => {
    if (!open) return
    setErrors({})
    setValues(authType ? formValuesFromAuthType(authType) : EMPTY_AUTH_TYPE_FORM)
  }, [authType, open])

  const isInternal = values.type === 'internal'
  const isSso = isSsoAuthType(values.type)
  const showScope = isRootAdmin && mode === 'create' && isSso
  const hasSecret = authType?.has_client_secret ?? false

  const typeOptions = useMemo(() => {
    // Solo lo que este formulario sabe construir (SSO_AUTH_TYPE_KINDS); `internal`
    // aparece únicamente al editar la conexión global.
    const available = (authTypeTypes ?? []).filter((type) => isSsoAuthType(type) || (type === 'internal' && mode === 'edit'))
    return available.map((type) => ({ value: type, label: t(`types.${type}`, { defaultValue: type }) }))
  }, [authTypeTypes, mode, t])

  const scopeOptions = useMemo(
    () => [
      { value: '', label: t('fields.scopeGlobal') },
      ...Object.values(organizationsById).map((org) => ({ value: org.id, label: org.name })),
    ],
    [organizationsById, t],
  )

  const domainPreview = useMemo(() => parseDomainList(values.emailDomainsText), [values.emailDomainsText])

  if (!canManage) return null

  const set = <K extends keyof AuthTypeFormValues>(field: K, value: AuthTypeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async () => {
    const validation = validateAuthTypeForm(values, mode, hasSecret)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return Promise.reject(new Error('validation'))
    }
    await new Promise<void>((resolve, reject) => {
      if (authType) {
        const data = buildUpdateRequest(values, authType)
        updateAuthType.mutate({ id: authType.id, data }, { onSuccess: () => resolve(), onError: reject })
      } else {
        const data = buildCreateRequest(values, { includeOrganization: showScope })
        createAuthType.mutate(data, {
          onSuccess: () => {
            setValues(EMPTY_AUTH_TYPE_FORM)
            resolve()
          },
          onError: reject,
        })
      }
    })
  }

  const err = (key: AuthTypeFormErrorKey) => (errors[key] ? t(errors[key] as string) : undefined)

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? t('createDialog.title') : t('editDialog.title')}
      icon={mode === 'create' ? Plus : Edit}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: mode === 'create' ? t('common:create') : t('common:update'),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t('common:name')}
          name="name"
          value={values.name}
          onChange={(value) => set('name', value as string)}
          placeholder={t('createDialog.namePlaceholder')}
          error={err('name')}
          required
        />
        <HuemulField
          type="select"
          label={t('columns.type')}
          name="type"
          value={values.type}
          options={typeOptions}
          onChange={(value) => set('type', value as AuthTypeKind)}
          placeholder={t('createDialog.typePlaceholder')}
          disabled={isInternal}
          description={isInternal ? t('fields.internalHint') : undefined}
        />
        {showScope && (
          <HuemulField
            type="select"
            label={t('fields.scope')}
            name="organization_id"
            value={values.organizationId}
            options={scopeOptions}
            onChange={(value) => set('organizationId', value as string)}
            helpText={t('fields.scopeHint')}
          />
        )}
        {isSso && (
          <>
            <HuemulField
              label={t('fields.clientId')}
              name="client_id"
              value={values.clientId}
              onChange={(value) => set('clientId', value as string)}
              placeholder={t('fields.clientIdPlaceholder')}
              error={err('clientId')}
              required
            />
            {values.type === 'microsoft' && (
              <>
                <HuemulField
                  label={t('fields.tenantId')}
                  name="tenant_id"
                  value={values.tenantId}
                  onChange={(value) => set('tenantId', value as string)}
                  placeholder={t('fields.tenantIdPlaceholder')}
                  helpText={t('fields.tenantIdHint')}
                />
                <HuemulField
                  type="textarea"
                  label={t('fields.allowedTenantIds')}
                  name="allowed_tenant_ids"
                  value={values.allowedTenantIdsText}
                  onChange={(value) => set('allowedTenantIdsText', value as string)}
                  placeholder={t('fields.listPlaceholder')}
                  helpText={t('fields.allowedTenantIdsHint')}
                  error={err('allowedTenantIds')}
                  required
                />
              </>
            )}
            {values.type === 'google' && (
              <HuemulField
                type="textarea"
                label={t('fields.allowedHostedDomains')}
                name="allowed_hosted_domains"
                value={values.allowedHostedDomainsText}
                onChange={(value) => set('allowedHostedDomainsText', value as string)}
                placeholder={t('fields.domainsPlaceholder')}
                helpText={t('fields.allowedHostedDomainsHint')}
                error={err('allowedHostedDomains')}
                required
              />
            )}
            <HuemulField
              type="select"
              label={t('fields.autoProvision')}
              name="auto_provision"
              value={values.autoProvision}
              options={AUTO_PROVISION_VALUES.map((value) => ({ value, label: t(`fields.autoProvisionOptions.${value}`) }))}
              onChange={(value) => set('autoProvision', value as AutoProvision)}
              helpText={t('fields.autoProvisionHint')}
            />
            <HuemulField
              type="textarea"
              label={t('fields.emailDomains')}
              name="email_domains"
              value={values.emailDomainsText}
              onChange={(value) => set('emailDomainsText', value as string)}
              placeholder={t('fields.domainsPlaceholder')}
              helpText={t('fields.emailDomainsHint')}
              error={err('emailDomains')}
            />
            {domainPreview.length > 0 && (
              <div className="flex flex-wrap gap-1" data-testid="email-domains-preview">
                {domainPreview.map((domain) => (
                  <Badge key={domain} variant="secondary">{domain}</Badge>
                ))}
              </div>
            )}
            <HuemulField
              type="password"
              label={t('fields.clientSecret')}
              name="client_secret"
              value={values.clientSecret}
              onChange={(value) => set('clientSecret', value as string)}
              placeholder={hasSecret ? t('fields.secretConfigured') : t('fields.clientSecretPlaceholder')}
              description={hasSecret ? t('fields.leaveEmptyToKeep') : t('fields.clientSecretHint')}
              error={err('clientSecret')}
              required={mode === 'create'}
              autoComplete="new-password"
            />
            <HuemulField
              type="switch"
              label={t('fields.isActive')}
              name="is_active"
              value={values.isActive}
              onChange={(value) => set('isActive', Boolean(value))}
              helpText={t('fields.isActiveHint')}
            />
          </>
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}

/** Compatibilidad con los imports anteriores. */
export function CreateAuthTypeDialog(props: Omit<AuthTypeFormDialogProps, 'authType'>) {
  return <AuthTypeFormDialog {...props} authType={null} />
}

export function EditAuthTypeDialog(props: AuthTypeFormDialogProps & { authType: AuthType | null }) {
  return <AuthTypeFormDialog {...props} />
}

/** Reexport para quien consulte `parseListInput` desde el diálogo (tests). */
export { parseListInput }
