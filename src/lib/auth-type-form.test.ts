/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 5 · helpers del formulario de conexiones.
 */
import { describe, expect, it } from 'vitest'

import {
  EMPTY_AUTH_TYPE_FORM,
  buildCreateRequest,
  buildUpdateRequest,
  formValuesFromAuthType,
  parseDomainList,
  parseListInput,
  validateAuthTypeForm,
} from '@/lib/auth-type-form'
import type { AuthType } from '@/types/auth-types'

const microsoftConnection: AuthType = {
  id: 'c1',
  name: 'Microsoft Contoso',
  type: 'microsoft',
  params: { client_id: 'app-1', tenant_id: null, allowed_tenant_ids: ['t1'], auto_provision: 'off' },
  organization_id: 'org-a',
  is_active: true,
  email_domains: ['contoso.example.com'],
  has_client_secret: true,
  is_sso: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('auth-type-form', () => {
  it('parsea listas por línea, coma o punto y coma, sin duplicados; los dominios en minúsculas y sin @', () => {
    expect(parseListInput(' t1 , t2\nT2;t3 ')).toEqual(['t1', 't2', 'T2', 't3'])
    expect(parseDomainList('Contoso.Example.com, @contoso.example.com\nfilial.example.com')).toEqual([
      'contoso.example.com',
      'filial.example.com',
    ])
  })

  it('crear microsoft manda params, dominios, secreto y ámbito (root admin)', () => {
    const request = buildCreateRequest(
      {
        ...EMPTY_AUTH_TYPE_FORM,
        name: ' Microsoft Contoso ',
        type: 'microsoft',
        clientId: 'app-1',
        allowedTenantIdsText: 't1\nt2',
        emailDomainsText: 'Contoso.example.com',
        clientSecret: 's3cr3t',
        organizationId: 'org-a',
      },
      { includeOrganization: true },
    )
    expect(request).toEqual({
      name: 'Microsoft Contoso',
      type: 'microsoft',
      is_active: true,
      params: { client_id: 'app-1', tenant_id: null, allowed_tenant_ids: ['t1', 't2'], auto_provision: 'off' },
      email_domains: ['contoso.example.com'],
      client_secret: 's3cr3t',
      organization_id: 'org-a',
    })
  })

  it('un tenant_id single-tenant sin lista se usa como allowed_tenant_ids; google exige hosted domains', () => {
    const ms = buildCreateRequest(
      { ...EMPTY_AUTH_TYPE_FORM, name: 'x', type: 'microsoft', clientId: 'app', tenantId: 'tenant-1', clientSecret: 's' },
      { includeOrganization: false },
    )
    expect(ms.params).toMatchObject({ tenant_id: 'tenant-1', allowed_tenant_ids: ['tenant-1'] })
    expect(ms.organization_id).toBeUndefined()

    const errors = validateAuthTypeForm({ ...EMPTY_AUTH_TYPE_FORM, name: 'g', type: 'google', clientId: 'app', clientSecret: 's' }, 'create', false)
    expect(errors.allowedHostedDomains).toBe('validation.allowedHostedDomainsRequired')
    const okGoogle = buildCreateRequest(
      { ...EMPTY_AUTH_TYPE_FORM, name: 'g', type: 'google', clientId: 'app', allowedHostedDomainsText: 'contoso.example.com', autoProvision: 'pending', clientSecret: 's' },
      { includeOrganization: false },
    )
    expect(okGoogle.params).toEqual({ client_id: 'app', allowed_hosted_domains: ['contoso.example.com'], auto_provision: 'pending' })
  })

  it('valida: nombre, client_id, tenants (organizations no cuenta), secreto en alta, dominios inválidos', () => {
    const errors = validateAuthTypeForm(
      { ...EMPTY_AUTH_TYPE_FORM, type: 'microsoft', tenantId: 'organizations', emailDomainsText: 'no es dominio' },
      'create',
      false,
    )
    expect(errors).toEqual({
      name: 'validation.nameRequired',
      clientId: 'validation.clientIdRequired',
      allowedTenantIds: 'validation.allowedTenantIdsRequired',
      emailDomains: 'validation.invalidDomain',
      clientSecret: 'validation.clientSecretRequired',
    })
    // En edición con secreto ya configurado no se exige uno nuevo.
    const edit = validateAuthTypeForm(formValuesFromAuthType(microsoftConnection), 'edit', true)
    expect(edit).toEqual({})
  })

  it('editar manda solo lo que cambió y el secreto solo si se escribió uno nuevo', () => {
    const values = formValuesFromAuthType(microsoftConnection)
    expect(buildUpdateRequest(values, microsoftConnection)).toEqual({})

    const renamed = buildUpdateRequest({ ...values, name: 'Nuevo nombre', isActive: false }, microsoftConnection)
    expect(renamed).toEqual({ name: 'Nuevo nombre', is_active: false })
    expect('client_secret' in renamed).toBe(false)

    const rotated = buildUpdateRequest({ ...values, clientSecret: 'nuevo' }, microsoftConnection)
    expect(rotated).toEqual({ client_secret: 'nuevo' })

    const domains = buildUpdateRequest({ ...values, emailDomainsText: 'contoso.example.com\nnuevo.example.com' }, microsoftConnection)
    expect(domains).toEqual({ email_domains: ['contoso.example.com', 'nuevo.example.com'] })
  })
})
