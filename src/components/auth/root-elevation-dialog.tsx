/**
 * Diálogo del modo administrador (docs/sso-frontend.md §2.1, Fase 7).
 *
 * Aparece cuando `rootElevationStore` tiene un pedido abierto: lo abre `httpClient`
 * ante un 403 de elevación, el menú del avatar ("Enter admin mode") o `/global-admin`.
 * Al abrirse pide el código al correo del root, lo canjea por el token de elevación y
 * lo entrega al store, que libera a las requests que esperaban para reintentarse.
 * Cancelar deja la sesión intacta: solo la acción que lo pidió queda sin hacer.
 *
 * Se monta una sola vez en `App.tsx`, dentro de los providers.
 */
import { useState, useSyncExternalStore } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { HuemulDialog } from '@/huemul/components/huemul-dialog'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { OtpCodeInput } from '@/components/auth/otp-code-input'
import { useOtpResend } from '@/hooks/useOtpResend'
import { isErrorCode, isStatusCode } from '@/lib/error-utils'
import { rootElevationStore, type RootElevationReason } from '@/lib/root-elevation-store'
import { requestRootElevationCode, verifyRootElevationCode } from '@/services/auth-root-elevation'

const DESCRIPTION_KEYS: Record<RootElevationReason, string> = {
  required: 'rootElevation.requiredDescription',
  expired: 'rootElevation.expiredDescription',
  manual: 'rootElevation.manualDescription',
}

export function RootElevationDialog() {
  const snapshot = useSyncExternalStore(rootElevationStore.subscribe, rootElevationStore.getSnapshot)
  if (!snapshot.prompt) return null
  // `key`: cada pedido nuevo arranca con su propio envío de código y estado limpio.
  return <RootElevationDialogContent key={snapshot.prompt.id} promptId={snapshot.prompt.id} reason={snapshot.prompt.reason} />
}

function RootElevationDialogContent({ promptId, reason }: { promptId: number; reason: RootElevationReason }) {
  const { t } = useTranslation('auth')
  const [code, setCode] = useState('')

  // El envío inicial es una query con clave por pedido, no una mutación disparada en un
  // efecto: en StrictMode el desmontaje simulado desengancha la mutación en curso y su
  // respuesta nunca llega (el diálogo quedaba en "Sending a code..."). La query se
  // dedupe por clave, así sale un solo correo por pedido, y no se revalida sola.
  const codeRequest = useQuery({
    queryKey: ['root-elevation', 'code', promptId],
    queryFn: requestRootElevationCode,
    staleTime: Infinity,
    // Holgado a propósito: con 0 el remontaje de StrictMode podía recolectarla y pedir otro
    // código. Cada pedido tiene su propia clave, así que no se reutiliza entre pedidos.
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Los errores se muestran en el diálogo, no como toast global.
    meta: { showErrorToast: false },
  })
  const { resendCooldown, resendMutation, resend } = useOtpResend(requestRootElevationCode)

  const verifyMutation = useMutation({
    mutationFn: (otpCode: string) => verifyRootElevationCode(otpCode),
    onSuccess: (result) => {
      rootElevationStore.resolve(result.elevation_token, Date.parse(result.expires_at))
    },
    onError: () => {
      setCode('')
    },
  })

  const cancel = () => rootElevationStore.cancel()

  const notAllowed = isErrorCode(codeRequest.error, 'ROOT_ADMIN_REQUIRED')
  const email = codeRequest.data?.email ?? resendMutation.data?.email ?? null

  const verifyError = verifyMutation.error
    ? isStatusCode(verifyMutation.error, 429)
      ? t('errors.tooManyRequests')
      : t('errors.invalidCode')
    : null
  const resendError = resendMutation.error
    ? isStatusCode(resendMutation.error, 429)
      ? t('errors.tooManyRequests')
      : t('errors.resendFailed')
    : null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (code.length === 6) verifyMutation.mutate(code)
  }

  return (
    <HuemulDialog
      open
      onOpenChange={(open) => {
        if (!open) cancel()
      }}
      title={t('rootElevation.title')}
      icon={ShieldCheck}
      maxWidth="sm:max-w-md"
      showFooter={false}
    >
      <div className="flex flex-col gap-4 py-2" data-testid="root-elevation-dialog">
        {codeRequest.isPending && (
          <FieldDescription className="text-gray-600">{t('rootElevation.sendingCode')}</FieldDescription>
        )}

        {notAllowed && (
          <FieldDescription className="text-red-600" role="alert">
            {t('rootElevation.notAllowed')}
          </FieldDescription>
        )}

        {codeRequest.isError && !notAllowed && (
          <div className="flex flex-col gap-2">
            <FieldDescription className="text-red-600" role="alert">
              {t('errors.requestCodeFailed')}
            </FieldDescription>
            <HuemulButton variant="outline" label={t('otp.resend')} onClick={() => void codeRequest.refetch()} className="w-full" />
          </div>
        )}

        {codeRequest.isSuccess && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldDescription className="text-gray-700">
              {t(DESCRIPTION_KEYS[reason], { email })}
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor="root-elevation-otp" className="sr-only">
                {t('otp.verificationCode')}
              </FieldLabel>
              <OtpCodeInput id="root-elevation-otp" value={code} onChange={setCode} />
              <FieldDescription className="text-center text-gray-600">
                {t('otp.didntReceiveCode')}{' '}
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendCooldown > 0 || resendMutation.isPending}
                  className="text-[#4464f7] hover:text-[#3451e6] hover:cursor-pointer font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-[#4464f7]"
                >
                  {resendMutation.isPending
                    ? t('otp.sending')
                    : resendCooldown > 0
                      ? t('otp.resendIn', { seconds: resendCooldown })
                      : t('otp.resend')}
                </button>
              </FieldDescription>
            </Field>
            <HuemulButton
              type="submit"
              label={verifyMutation.isPending ? t('otp.verifying') : t('rootElevation.submit')}
              loading={verifyMutation.isPending}
              disabled={code.length !== 6}
              className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white font-medium"
            />
            {verifyError && (
              <FieldDescription className="text-red-600 text-center" role="alert">
                {verifyError}
              </FieldDescription>
            )}
            {resendError && (
              <FieldDescription className="text-red-600 text-center">{resendError}</FieldDescription>
            )}
            {resendMutation.isSuccess && (
              <FieldDescription className="text-green-600 text-center">{t('otp.codeSentSuccess')}</FieldDescription>
            )}
          </form>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t">
          <HuemulButton variant="ghost" label={t('rootElevation.cancel')} onClick={cancel} className="w-full" />
        </div>
      </div>
    </HuemulDialog>
  )
}
