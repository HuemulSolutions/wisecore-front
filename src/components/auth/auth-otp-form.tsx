import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { WisecoreLogo } from "@/components/ui/wisecore-logo"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authService } from "@/services/auth"
import { useAuth } from "@/contexts/auth-context"
import { isStatusCode } from "@/lib/error-utils"
import { AuthLegalFooter } from "@/components/auth/auth-legal-footer"
import type { OTPFormProps } from "@/types/auth"

export type { OTPFormProps } from "@/types/auth"

// El primer código ya se acaba de enviar desde LoginForm — arrancar el
// cooldown también al montar evita un reenvío inmediato que solo produciría
// el mismo código o un rate-limit del backend.
const RESEND_COOLDOWN_SECONDS = 60

export function OTPForm({
  className,
  email,
  purpose,
  onBack,
  onSuccess,
  ...props
}: OTPFormProps) {
  const [code, setCode] = useState("")
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const { login } = useAuth()
  const { t } = useTranslation('auth')

  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      return authService.verifyCode({ email, code: otpCode })
    },
    onSuccess: (data) => {
      login(data.token, data.user)
      onSuccess?.()
    },
    onError: () => {
      setCode("") // Clear the code on error
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authService.requestCode({ email, purpose }),
    onSuccess: () => {
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    },
  })

  // Cuenta atrás de 1s; al llegar a 0 también limpia el mensaje de éxito del
  // reenvío anterior (si no, "¡Código enviado!" queda visible indefinidamente).
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((seconds) => {
        if (seconds <= 1) {
          resendMutation.reset()
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resendMutation es estable entre renders (react-query)
  }, [resendCooldown])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code && code.length === 6) {
      verifyMutation.mutate(code)
    }
  }

  const handleResend = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return
    resendMutation.mutate()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <HuemulFieldGroup>
          {onBack && (
            <div className="w-full flex justify-start mb-4">
              <HuemulButton
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                iconClassName="h-4 w-4"
                label={t('otp.back')}
                onClick={onBack}
                type="button"
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-4 text-center">
            <WisecoreLogo size="lg" className="text-[#4464f7]" />
            <h1 className="text-2xl font-bold text-gray-900">{t('otp.title')}</h1>
            <FieldDescription className="text-gray-600">
              {t('otp.description')} <span className="font-medium text-gray-900">{email}</span>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              {t('otp.verificationCode')}
            </FieldLabel>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                id="otp"
                value={code}
                onChange={(value) => setCode(value)}
                required
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={1} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={2} className="h-14 w-12 text-xl font-semibold" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={4} className="h-14 w-12 text-xl font-semibold" />
                  <InputOTPSlot index={5} className="h-14 w-12 text-xl font-semibold" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <FieldDescription className="text-center text-gray-600">
              {t('otp.didntReceiveCode')}{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendMutation.isPending}
                className="text-[#4464f7] hover:text-[#3451e6] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-[#4464f7]"
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
            label={verifyMutation.isPending ? t('otp.verifying') : t('otp.verifyCode')}
            loading={verifyMutation.isPending}
            disabled={code.length !== 6}
            className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white font-medium py-2.5 transition-colors"
          />
          {verifyError && (
            <FieldDescription className="text-red-600 text-center">
              {verifyError}
            </FieldDescription>
          )}
          {resendError && (
            <FieldDescription className="text-red-600 text-center">
              {resendError}
            </FieldDescription>
          )}
          {resendMutation.isSuccess && (
            <FieldDescription className="text-green-600 text-center">
              {t('otp.codeSentSuccess')}
            </FieldDescription>
          )}
        </HuemulFieldGroup>
      </form>
      <AuthLegalFooter />
    </div>
  )
}
