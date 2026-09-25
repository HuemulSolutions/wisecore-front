/**
 * Helpers puros del formulario de conexiones de autenticación
 * (docs/sso-frontend.md, Fase 5). Sin React ni i18n: se testean solos.
 */
import type { AuthType, AuthTypeKind, AuthTypeParams, AutoProvision, CreateAuthTypeRequest, UpdateAuthTypeRequest } from '@/types/auth-types'
import { isGoogleParams, isMicrosoftParams, isSsoAuthType } from '@/types/auth-types'

const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** "a.com, B.COM\n@c.com" → ["a.com", "b.com", "c.com"]; sin duplicados, en orden. */
export function parseListInput(raw: string): string[] {
  const out: string[] = []
  for (const piece of raw.split(/[\n,;]+/)) {
    const value = piece.trim()
    if (value && !out.includes(value)) out.push(value)
  }
  return out
}

/** Igual que `parseListInput` pero normaliza como dominio (minúsculas, sin `@`). */
export function parseDomainList(raw: string): string[] {
  const out: string[] = []
  for (const piece of parseListInput(raw)) {
    const value = piece.toLowerCase().replace(/^@+/, '')
    if (value && !out.includes(value)) out.push(value)
  }
  return out
}

export function invalidDomains(domains: string[]): string[] {
  return domains.filter((d) => !DOMAIN_RE.test(d))
}

export function listToInput(values: readonly string[] | null | undefined): string {
  return (values ?? []).join('\n')
}

export interface AuthTypeFormValues {
  name: string
  type: AuthTypeKind
  isActive: boolean
  emailDomainsText: string
  clientSecret: string
  clientId: string
  tenantId: string
  allowedTenantIdsText: string
  allowedHostedDomainsText: string
  autoProvision: AutoProvision
  /** '' = global (solo root admin). */
  organizationId: string
}

export const EMPTY_AUTH_TYPE_FORM: AuthTypeFormValues = {
  name: '',
  type: 'microsoft',
  isActive: true,
  emailDomainsText: '',
  clientSecret: '',
  clientId: '',
  tenantId: '',
  allowedTenantIdsText: '',
  allowedHostedDomainsText: '',
  autoProvision: 'off',
  organizationId: '',
}

export function formValuesFromAuthType(authType: AuthType): AuthTypeFormValues {
  const params = authType.params
  return {
    ...EMPTY_AUTH_TYPE_FORM,
    name: authType.name,
    type: authType.type,
    isActive: authType.is_active ?? true,
    emailDomainsText: listToInput(authType.email_domains),
    clientId: params?.client_id ?? '',
    tenantId: isMicrosoftParams(params) ? (params.tenant_id ?? '') : '',
    allowedTenantIdsText: isMicrosoftParams(params) ? listToInput(params.allowed_tenant_ids) : '',
    allowedHostedDomainsText: isGoogleParams(params) ? listToInput(params.allowed_hosted_domains) : '',
    autoProvision: params?.auto_provision ?? 'off',
    organizationId: authType.organization_id ?? '',
  }
}

export type AuthTypeFormErrorKey =
  | 'name'
  | 'clientId'
  | 'allowedTenantIds'
  | 'allowedHostedDomains'
  | 'emailDomains'
  | 'clientSecret'

/** Devuelve los campos inválidos con la clave de i18n (`validation.*`) del mensaje. */
export function validateAuthTypeForm(values: AuthTypeFormValues, mode: 'create' | 'edit', hasSecret: boolean): Partial<Record<AuthTypeFormErrorKey, string>> {
  const errors: Partial<Record<AuthTypeFormErrorKey, string>> = {}
  if (!values.name.trim()) errors.name = 'validation.nameRequired'
  if (!isSsoAuthType(values.type)) return errors

  if (!values.clientId.trim()) errors.clientId = 'validation.clientIdRequired'
  if (values.type === 'microsoft') {
    const tenants = parseListInput(values.allowedTenantIdsText)
    const single = values.tenantId.trim()
    const isAlias = ['common', 'organizations', 'consumers'].includes(single.toLowerCase())
    if (tenants.length === 0 && (!single || isAlias)) errors.allowedTenantIds = 'validation.allowedTenantIdsRequired'
  }
  if (values.type === 'google') {
    const hosted = parseDomainList(values.allowedHostedDomainsText)
    if (hosted.length === 0) errors.allowedHostedDomains = 'validation.allowedHostedDomainsRequired'
    else if (invalidDomains(hosted).length > 0) errors.allowedHostedDomains = 'validation.invalidDomain'
  }
  const domains = parseDomainList(values.emailDomainsText)
  if (invalidDomains(domains).length > 0) errors.emailDomains = 'validation.invalidDomain'
  if (mode === 'create' && !values.clientSecret.trim() && !hasSecret) errors.clientSecret = 'validation.clientSecretRequired'
  return errors
}

export function buildParams(values: AuthTypeFormValues): AuthTypeParams | null {
  if (values.type === 'microsoft') {
    const tenants = parseListInput(values.allowedTenantIdsText)
    const single = values.tenantId.trim()
    return {
      client_id: values.clientId.trim(),
      tenant_id: single || null,
      allowed_tenant_ids: tenants.length > 0 ? tenants : single ? [single] : [],
      auto_provision: values.autoProvision,
    }
  }
  if (values.type === 'google') {
    return {
      client_id: values.clientId.trim(),
      allowed_hosted_domains: parseDomainList(values.allowedHostedDomainsText),
      auto_provision: values.autoProvision,
    }
  }
  return null
}

export function buildCreateRequest(values: AuthTypeFormValues, options: { includeOrganization: boolean }): CreateAuthTypeRequest {
  const request: CreateAuthTypeRequest = {
    name: values.name.trim(),
    type: values.type,
    is_active: values.isActive,
  }
  if (isSsoAuthType(values.type)) {
    request.params = buildParams(values)
    request.email_domains = parseDomainList(values.emailDomainsText)
    if (values.clientSecret.trim()) request.client_secret = values.clientSecret.trim()
  }
  if (options.includeOrganization) {
    request.organization_id = values.organizationId || null
  }
  return request
}

/** Solo lo que cambió respecto de `original`; `client_secret` solo si el usuario escribió algo. */
export function buildUpdateRequest(values: AuthTypeFormValues, original: AuthType): UpdateAuthTypeRequest {
  const request: UpdateAuthTypeRequest = {}
  const name = values.name.trim()
  if (name !== original.name) request.name = name
  if (values.type !== original.type) request.type = values.type
  if (values.isActive !== (original.is_active ?? true)) request.is_active = values.isActive
  if (isSsoAuthType(values.type)) {
    const params = buildParams(values)
    if (JSON.stringify(params) !== JSON.stringify(original.params ?? null)) request.params = params
    const domains = parseDomainList(values.emailDomainsText)
    if (JSON.stringify(domains) !== JSON.stringify(original.email_domains ?? [])) request.email_domains = domains
    if (values.clientSecret.trim()) request.client_secret = values.clientSecret.trim()
  }
  return request
}
