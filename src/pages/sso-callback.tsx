/* eslint-disable react-refresh/only-export-components -- exporta constantes/helpers de test junto a la página */
/**
 * `/auth/sso/callback`: vuelta del proveedor de identidad (docs/sso-frontend.md §2).
 *
 * El backend redirige aquí con `?code=<handoff>` (login), `?error=<código>` o
 * `?linked=1` (vinculación desde la sesión). El JWT nunca viaja en la URL: el
 * handoff code se canjea con `POST /auth/sso/exchange`, es de un solo uso y dura
 * 60 s, por eso se quita de la URL apenas se lee y se guarda en un `Set` a nivel
 * de módulo para que StrictMode (monta → desmonta → monta) no lo canjee dos veces.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { WisecoreLogo } from '@/components/ui/wisecore-logo'
import { FieldDescription } from '@/components/ui/field'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { useAuth } from '@/contexts/auth-context'
import { useCompleteLogin } from '@/hooks/useCompleteLogin'
import { authSsoQueryKeys } from '@/hooks/useAuthSso'
import { authService } from '@/services/auth'
import { ApiError } from '@/types/api-error'
import { consumeReturnUrl, pathBelongsToOtherOrg, sanitizeReturnPath } from '@/lib/return-url'
import { consumePendingSsoState } from '@/lib/sso-redirect'
import { logger } from '@/lib/logger'
import { AuthLegalFooter } from '@/components/auth/auth-legal-footer'
import type { SsoErrorCode } from '@/types/auth'

export const SSO_CALLBACK_PATH = '/auth/sso/callback'

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set<SsoErrorCode>([
  'invalid_state',
  'idp_error',
  'token_exchange_failed',
  'invalid_id_token',
  'tenant_not_allowed',
  'domain_not_allowed',
  'email_missing',
  'email_not_verified',
  'account_conflict',
  'identity_taken',
  'user_not_found',
  'user_not_active',
  'connection_disabled',
  'sso_disabled',
  'discovery_failed',
  'handoff_invalid',
])

/** Códigos ya canjeados en este proceso (anti doble canje bajo StrictMode). */
const consumedCodes = new Set<string>()

/** Solo para tests: permite reutilizar un código entre casos. */
export function resetConsumedSsoCodes(): void {
  consumedCodes.clear()
}

type CallbackState =
  | { status: 'working' }
  | { status: 'error'; code: string }
  | { status: 'step-up' }

function errorCodeFrom(error: unknown): string {
  if (error instanceof ApiError && KNOWN_ERROR_CODES.has(error.detail)) return error.detail
  return 'handoff_invalid'
}

export function SsoCallbackPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading } = useAuth()
  const completeLogin = useCompleteLogin()
  const [state, setState] = useState<CallbackState>({ status: 'working' })

  // Los parámetros se capturan una sola vez: el primer efecto los saca de la URL.
  const paramsRef = useRef({
    code: searchParams.get('code'),
    error: searchParams.get('error'),
    linked: searchParams.get('linked'),
    returnTo: sanitizeReturnPath(searchParams.get('return_to')),
  })
  const startedRef = useRef(false)

  useEffect(() => {
    if (isLoading || startedRef.current) return
    startedRef.current = true
    const { code, error, linked, returnTo } = paramsRef.current

    if (code || error || linked) {
      // Quitar code/error de la barra y del historial: refrescar no debe re-canjear.
      navigate(SSO_CALLBACK_PATH, { replace: true })
    }

    if (error) {
      logger.warn('[sso-callback] identity provider flow failed', error)
      setState({ status: 'error', code: error })
      return
    }

    if (linked) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
        return
      }
      queryClient.invalidateQueries({ queryKey: authSsoQueryKeys.identities() })
      toast.success(t('ssoCallback.linkedSuccess'))
      navigate(returnTo ?? '/home', { replace: true })
      return
    }

    if (!code) {
      navigate('/login', { replace: true })
      return
    }
    if (consumedCodes.has(code)) return
    consumedCodes.add(code)

    const pending = consumePendingSsoState()
    authService
      .exchangeSsoCode(code)
      .then(async (exchange) => {
        const result = await completeLogin({
          token: exchange.token,
          user: exchange.user,
          organizationId: pending?.pendingOrganizationId ?? null,
        })
        if (result.stepUpRequired) {
          // La organización exige otro método incluso tras este SSO: no volver a
          // redirigir automáticamente (anti-loop); el usuario elige a mano.
          setState({ status: 'step-up' })
          return
        }
        let target =
          sanitizeReturnPath(exchange.return_to) ??
          returnTo ??
          pending?.returnUrl ??
          consumeReturnUrl()
        // Nunca volver a una ruta de otra organización: AppLayout la tomaría como
        // deep link y re-seleccionaría la org anterior.
        if (result.organizationId && pathBelongsToOtherOrg(target, result.organizationId)) {
          target = null
        }
        if (target) {
          navigate(target, { replace: true })
        } else if (result.organizationId) {
          navigate(`/${result.organizationId}/home`, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch((exchangeError: unknown) => {
        logger.error('[sso-callback] exchange failed', exchangeError)
        setState({ status: 'error', code: errorCodeFrom(exchangeError) })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- corre una sola vez cuando la sesión terminó de restaurarse
  }, [isLoading])

  const goToLogin = () => navigate(isAuthenticated ? '/' : '/login', { replace: true })

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <WisecoreLogo size="lg" className="text-[#4464f7]" />
          {state.status === 'working' && (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#4464f7]" aria-hidden />
              <FieldDescription className="text-gray-600">{t('ssoCallback.exchanging')}</FieldDescription>
            </>
          )}
          {state.status === 'error' && (
            <>
              <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden />
              <h1 className="text-2xl font-bold text-gray-900">{t('ssoCallback.errorTitle')}</h1>
              <FieldDescription className="text-red-600" role="alert">
                {t(`ssoErrors.${state.code}`, { defaultValue: t('ssoErrors.generic') })}
              </FieldDescription>
              <HuemulButton icon={ArrowLeft} label={t('ssoCallback.backToLogin')} onClick={goToLogin} className="w-full" />
            </>
          )}
          {state.status === 'step-up' && (
            <>
              <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
              <h1 className="text-2xl font-bold text-gray-900">{t('stepUp.title')}</h1>
              <FieldDescription className="text-gray-600" role="alert">
                {t('stepUp.stillRequired')}
              </FieldDescription>
              <HuemulButton label={t('stepUp.chooseAnotherOrganization')} onClick={() => navigate('/', { replace: true })} className="w-full" />
            </>
          )}
        </div>
        <AuthLegalFooter />
      </div>
    </div>
  )
}

export default SsoCallbackPage
