/**
 * Máquina de estados del login (docs/sso-frontend.md §2, casos A/B/C).
 *
 * Los componentes (`LoginForm`, `OTPForm`, `AuthOrganizationPicker`) son tontos:
 * hacen su request y entregan el resultado aquí, que decide el paso siguiente.
 * Se reutiliza tal cual en el diálogo de step-up (Fase 4) con
 * `targetOrganizationId` y `lockedEmail`.
 */
import { useCallback, useState } from 'react'

import { useCompleteLogin, type CompleteLoginResult } from '@/hooks/useCompleteLogin'
import { beginSsoRedirect } from '@/lib/sso-redirect'
import { peekReturnUrl } from '@/lib/return-url'
import { authService } from '@/services/auth'
import type {
  LoginOrganizationOption,
  RequestCodeResult,
  SelectOrganizationResult,
  SsoFlowPayload,
  VerifyCodeResult,
} from '@/types/auth'

export type OtpVariant = 'login' | 'preauth'

export type LoginStep =
  | { kind: 'email' }
  | { kind: 'otp'; email: string; variant: OtpVariant; resend: () => Promise<unknown> }
  | { kind: 'choose-organization'; email: string; preauthToken: string; organizations: LoginOrganizationOption[] }
  | { kind: 'sso-redirect'; sso: SsoFlowPayload }

export interface UseLoginFlowOptions {
  initialEmail?: string
  /** Organización que debe quedar seleccionada (step-up): salta el selector si está en la lista. */
  targetOrganizationId?: string | null
  /** Ruta a la que volver tras un SSO iniciado desde aquí. Por defecto, `returnUrl` guardada. */
  returnUrl?: string | null
  /** Se llama cuando el login terminó (con o sin organización auto-seleccionada). */
  onCompleted?: (result: CompleteLoginResult) => void
}

export function useLoginFlow(options: UseLoginFlowOptions = {}) {
  const { initialEmail = '', targetOrganizationId = null, returnUrl, onCompleted } = options
  const completeLogin = useCompleteLogin()
  const [email, setEmail] = useState(initialEmail)
  const [step, setStep] = useState<LoginStep>({ kind: 'email' })

  const finish = useCallback(
    async (token: string, user: Parameters<typeof completeLogin>[0]['user'], organizationId?: string | null) => {
      const result = await completeLogin({ token, user, organizationId: organizationId ?? targetOrganizationId })
      onCompleted?.(result)
      return result
    },
    [completeLogin, onCompleted, targetOrganizationId],
  )

  const goToIdp = useCallback(
    (sso: SsoFlowPayload, currentEmail: string, pendingOrganizationId: string | null) => {
      setStep({ kind: 'sso-redirect', sso })
      beginSsoRedirect({
        sso,
        email: currentEmail,
        returnUrl: returnUrl ?? peekReturnUrl(),
        pendingOrganizationId,
      })
    },
    [returnUrl],
  )

  /** Resultado de `POST /auth/login/select` (o de una selección automática). */
  const onOrganizationSelected = useCallback(
    (result: SelectOrganizationResult, organization: LoginOrganizationOption, preauthToken: string, currentEmail: string) => {
      if (result.kind === 'token') {
        void finish(result.token, result.user, organization.id)
        return
      }
      if (result.kind === 'sso') {
        goToIdp(result.sso, currentEmail, organization.id)
        return
      }
      // internal_code sin preauth verificado (LOGIN_MULTI_ORG_PREAUTH=false): el
      // reenvío repite `select`, no `/codes` (que devolvería choose_organization otra vez).
      setStep({
        kind: 'otp',
        email: currentEmail,
        variant: 'login',
        resend: () => authService.selectLoginOrganization({ preauth_token: preauthToken, organization_id: organization.id }),
      })
    },
    [finish, goToIdp],
  )

  const showOrganizationPicker = useCallback(
    async (currentEmail: string, preauthToken: string, organizations: LoginOrganizationOption[]) => {
      const target = targetOrganizationId ? organizations.find((o) => o.id === targetOrganizationId) : undefined
      if (target) {
        const result = await authService.selectLoginOrganization({ preauth_token: preauthToken, organization_id: target.id })
        onOrganizationSelected(result, target, preauthToken, currentEmail)
        return
      }
      setStep({ kind: 'choose-organization', email: currentEmail, preauthToken, organizations })
    },
    [onOrganizationSelected, targetOrganizationId],
  )

  /** Resultado de `POST /auth/codes`. */
  const onCodeRequested = useCallback(
    (result: RequestCodeResult, requestedEmail: string) => {
      setEmail(requestedEmail)
      switch (result.auth_flow) {
        case 'internal_code':
          setStep({ kind: 'otp', email: requestedEmail, variant: 'login', resend: () => authService.requestCode({ email: requestedEmail, purpose: 'login' }) })
          return
        case 'preauth_code':
          setStep({ kind: 'otp', email: requestedEmail, variant: 'preauth', resend: () => authService.requestCode({ email: requestedEmail, purpose: 'login' }) })
          return
        case 'sso':
          goToIdp(result.sso, requestedEmail, targetOrganizationId)
          return
        case 'choose_organization':
          void showOrganizationPicker(requestedEmail, result.preauth_token, result.organizations)
          return
      }
    },
    [goToIdp, showOrganizationPicker, targetOrganizationId],
  )

  /** Resultado de `POST /auth/codes/verify`. */
  const onVerified = useCallback(
    (result: VerifyCodeResult) => {
      if (result.kind === 'token') {
        void finish(result.token, result.user)
        return
      }
      void showOrganizationPicker(email, result.preauth_token, result.organizations)
    },
    [email, finish, showOrganizationPicker],
  )

  const back = useCallback(() => setStep({ kind: 'email' }), [])

  const retryIdpRedirect = useCallback(() => {
    if (step.kind === 'sso-redirect') {
      goToIdp(step.sso, email, targetOrganizationId)
    }
  }, [email, goToIdp, step, targetOrganizationId])

  return { step, email, onCodeRequested, onVerified, onOrganizationSelected, back, retryIdpRedirect }
}
