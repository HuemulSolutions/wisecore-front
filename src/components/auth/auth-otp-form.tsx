import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { OtpCodeInput } from "@/components/auth/otp-code-input"
import { useOtpResend } from "@/hooks/useOtpResend"
import { authService } from "@/services/auth"
import { isStatusCode } from "@/lib/error-utils"
import type { OTPFormProps } from "@/types/auth"

export type { OTPFormProps } from "@/types/auth"

export function OTPForm({
  className,
  email,
  variant = 'login',
  onBack,
  onVerified,
  onResend,
  ...props
}: OTPFormProps) {
  const [code, setCode] = useState("")
  // El primer código ya se acaba de enviar desde LoginForm: el cooldown arranca al montar.
  const { resendCooldown, resendMutation, resend: handleResend } = useOtpResend(onResend)
  const { t } = useTranslation('auth')

  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      return authService.verifyCode({ email, code: otpCode })
    },
    onSuccess: (data) => {
      // Token (caso B) o lista de organizaciones (caso C): lo decide `useLoginFlow`.
      onVerified(data)
    },
    onError: () => {
      setCode("") // Clear the code on error
    },
  })

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
            <h1 className="text-2xl font-bold text-gray-900">
              {variant === 'preauth' ? t('otp.preauthTitle') : t('otp.title')}
            </h1>
            <FieldDescription className="text-gray-600">
              {variant === 'preauth' ? t('otp.preauthDescription') : t('otp.description')}{" "}
              <span className="font-medium text-gray-900">{email}</span>
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              {t('otp.verificationCode')}
            </FieldLabel>
            <OtpCodeInput id="otp" value={code} onChange={setCode} />
            <FieldDescription className="text-center text-gray-600">
              {t('otp.didntReceiveCode')}{" "}
              <button
                type="button"
                onClick={handleResend}
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
    </div>
  )
}
