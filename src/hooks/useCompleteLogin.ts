/**
 * Cierra un login (por código, `select` o SSO): guarda la sesión y, si el backend
 * ya fijó la organización (`login_org_id` en el token, o una pendiente del flujo
 * SSO), pide el token de organización sin pasar por el diálogo de selección.
 *
 * Si el token de organización responde 403 `AUTH_METHOD_REQUIRED` (step-up,
 * docs/sso-frontend.md §2), NO redirige: devuelve `stepUpRequired` para que el
 * caller decida (evita loops entre el callback SSO y el IdP).
 */
import { useCallback } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { useOrganization } from '@/contexts/organization-context'
import { usePermissions } from '@/contexts/permissions-context'
import { isErrorCode, parseErrorDetail } from '@/lib/error-utils'
import { getLoginOrgIdFromToken } from '@/lib/jwt-utils'
import { logger } from '@/lib/logger'
import { generateOrganizationToken } from '@/services/organizations'
import type { AuthMethodRequiredDetail, RequiredAuthFlow } from '@/types/auth'
import type { User } from '@/types/users'

export interface CompleteLoginInput {
  token: string
  user: User
  /** Organización a seleccionar si el token no trae `login_org_id`. */
  organizationId?: string | null
}

export interface CompleteLoginResult {
  /** Organización seleccionada y con token, o null si hay que mostrar el diálogo. */
  organizationId: string | null
  /** Método que la organización exige (403 AUTH_METHOD_REQUIRED). */
  stepUpRequired?: RequiredAuthFlow | null
  /** Organización que pidió el step-up. */
  targetOrganizationId?: string | null
}

export const AUTH_METHOD_REQUIRED = 'AUTH_METHOD_REQUIRED'

export function useCompleteLogin() {
  const { login } = useAuth()
  const { setSelectedOrganizationId, setOrganizationToken, setRequiresOrganizationSelection } = useOrganization()
  const { refreshPermissions } = usePermissions()

  return useCallback(
    async ({ token, user, organizationId }: CompleteLoginInput): Promise<CompleteLoginResult> => {
      // `login()` emite el reset de sesión (limpia org/permisos) de forma síncrona;
      // lo que sigue vuelve a fijar la organización sobre el estado ya limpio.
      login(token, user)

      const orgId = organizationId ?? getLoginOrgIdFromToken(token)
      if (!orgId) {
        return { organizationId: null }
      }

      try {
        const tokenResponse = await generateOrganizationToken(orgId)
        const orgToken: string | undefined = tokenResponse?.token || tokenResponse?.data?.token
        if (!orgToken) {
          throw new Error('No token received from server')
        }
        setSelectedOrganizationId(orgId)
        setOrganizationToken(orgToken)
        setRequiresOrganizationSelection(false)
        refreshPermissions()
        return { organizationId: orgId }
      } catch (error) {
        if (isErrorCode(error, AUTH_METHOD_REQUIRED)) {
          const detail = parseErrorDetail<AuthMethodRequiredDetail>(error)
          logger.warn('[completeLogin] organization requires another sign-in method', orgId)
          return { organizationId: null, stepUpRequired: detail?.required_auth_flow ?? null, targetOrganizationId: orgId }
        }
        // Cualquier otro fallo: la sesión ya está iniciada; el diálogo de organización
        // aparece como siempre y el usuario elige a mano.
        logger.warn('[completeLogin] could not auto-select organization', orgId, error)
        return { organizationId: null }
      }
    },
    [login, setSelectedOrganizationId, setOrganizationToken, setRequiresOrganizationSelection, refreshPermissions],
  )
}
