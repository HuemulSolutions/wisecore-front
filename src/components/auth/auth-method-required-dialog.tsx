/**
 * Diálogo de step-up (docs/sso-frontend.md §2): la organización elegida exige
 * iniciar sesión con otro método que el usado hasta ahora.
 *
 * - Método SSO: botón que redirige al proveedor de identidad guardando la
 *   organización pendiente; al volver, el callback la selecciona.
 * - Método por código: el mismo flujo de login (`useLoginFlow`) dentro del
 *   diálogo, con el email fijo y la organización objetivo. NUNCA se llama a
 *   `logout()`: si el usuario cancela, su sesión anterior sigue intacta.
 * - Modo manual (segundo intento del mismo método en 10 min): sin redirección
 *   automática; se ofrece elegir otra organización.
 *
 * Se monta una sola vez en `App.tsx`, dentro de los providers.
 */
import { useSyncExternalStore } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { FieldDescription } from '@/components/ui/field'
import { AuthMethodBadge } from '@/components/auth/auth-method-badge'
import { LoginForm } from '@/components/auth/auth-login-form'
import { OTPForm } from '@/components/auth/auth-otp-form'
import { useAuth } from '@/contexts/auth-context'
import { useOrganization } from '@/contexts/organization-context'
import { useLoginFlow } from '@/hooks/useLoginFlow'
import { authStepUpStore, type StepUpSnapshot } from '@/lib/auth-step-up-store'
import { currentPath } from '@/lib/return-url'
import { beginSsoRedirect } from '@/lib/sso-redirect'
import { logger } from '@/lib/logger'

export function AuthMethodRequiredDialog() {
  const snapshot = useSyncExternalStore(authStepUpStore.subscribe, authStepUpStore.getSnapshot)
  if (!snapshot) return null
  // `key` reinicia el estado interno (flujo de login) por cada pedido distinto.
  return <StepUpDialogContent key={`${snapshot.request.organizationId}:${snapshot.attempts}`} snapshot={snapshot} />
}

function StepUpDialogContent({ snapshot }: { snapshot: StepUpSnapshot }) {
  const { t } = useTranslation(['auth', 'common'])
  const { user } = useAuth()
  const { setRequiresOrganizationSelection } = useOrganization()
  const { request, manual } = snapshot
  const required = request.required
  const methodType = required.auth_flow === 'sso' ? required.sso.type : 'internal'
  const methodName = required.auth_flow === 'sso' ? required.sso.name : t('auth:methods.email')
  const organizationLabel = request.organizationName ?? t('organizations:selection.title', { defaultValue: 'the organization' })
  // Desde el switcher es un cambio de organización: la URL actual es de la org
  // anterior y volver a ella la re-seleccionaría. El callback va al home de la
  // nueva. Solo el deep link (`orgsync`) ya está en una ruta de la org destino.
  const stepUpReturnUrl = request.source === 'orgsync' ? currentPath() : null

  const flow = useLoginFlow({
    initialEmail: user?.email ?? '',
    targetOrganizationId: request.organizationId,
    returnUrl: stepUpReturnUrl,
    onCompleted: (result) => {
      if (result.organizationId) {
        authStepUpStore.resolve()
      } else if (result.stepUpRequired) {
        logger.warn('[step-up] organization still requires another method')
        authStepUpStore.open({ ...request, required: result.stepUpRequired, source: request.source })
      }
    },
  })

  const goToIdp = () => {
    if (required.auth_flow !== 'sso') return
    beginSsoRedirect({
      sso: required.sso,
      email: user?.email ?? null,
      returnUrl: stepUpReturnUrl,
      pendingOrganizationId: request.organizationId,
    })
  }

  const chooseAnotherOrganization = () => {
    authStepUpStore.close()
    setRequiresOrganizationSelection(true)
  }

  return (
    <HuemulDialog
      open
      onOpenChange={(open) => {
        if (!open) authStepUpStore.close()
      }}
      title={t('auth:stepUp.title')}
      icon={ShieldCheck}
      maxWidth="sm:max-w-md"
      showFooter={false}
    >
      <div className="flex flex-col gap-4 py-2" data-testid="auth-step-up">
        <div className="flex flex-col gap-2">
          <FieldDescription className="text-gray-700">
            {t('auth:stepUp.description', { organization: organizationLabel, method: methodName })}
          </FieldDescription>
          <AuthMethodBadge type={methodType} name={methodName} className="self-start" />
        </div>

        {manual && (
          <FieldDescription className="text-amber-700" role="alert">
            {t('auth:stepUp.stillRequired')}
          </FieldDescription>
        )}

        {required.auth_flow === 'sso' && (
          <HuemulButton
            label={t('auth:stepUp.continueWith', { name: required.sso.name })}
            onClick={goToIdp}
            className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white"
          />
        )}

        {required.auth_flow === 'internal_code' && (
          <div className="flex flex-col gap-4">
            {flow.step.kind === 'email' && (
              <LoginForm
                initialEmail={flow.email}
                lockedEmail
                onCodeRequested={flow.onCodeRequested}
              />
            )}
            {flow.step.kind === 'otp' && (
              <OTPForm
                email={flow.step.email}
                variant={flow.step.variant}
                onBack={flow.back}
                onVerified={flow.onVerified}
                onResend={flow.step.resend}
              />
            )}
            {(flow.step.kind === 'choose-organization' || flow.step.kind === 'sso-redirect') && (
              <FieldDescription className="text-gray-600">{t('common:loading')}</FieldDescription>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t">
          <HuemulButton variant="outline" label={t('auth:stepUp.chooseAnotherOrganization')} onClick={chooseAnotherOrganization} className="w-full" />
          <HuemulButton variant="ghost" label={t('auth:stepUp.cancel')} onClick={() => authStepUpStore.close()} className="w-full" />
        </div>
      </div>
    </HuemulDialog>
  )
}
