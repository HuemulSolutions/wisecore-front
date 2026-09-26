import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { FieldDescription } from "@/components/ui/field"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { authService } from "@/services/auth"
import { isStatusCode } from "@/lib/error-utils"
import type { LoginFormProps } from "@/types/auth"

export type { LoginFormProps } from "@/types/auth"

export function LoginForm({
  className,
  onCodeRequested,
  initialEmail,
  lockedEmail = false,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail ?? "")
  const { t } = useTranslation(['auth', 'common'])

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "login" }),
    onSuccess: (result, requestedEmail) => {
      // El paso siguiente (OTP, selector de organización o redirección al IdP)
      // lo decide `useLoginFlow` según `auth_flow` (docs/sso-frontend.md §2).
      onCodeRequested?.(result, requestedEmail)
    },
  })

  // Mensaje genérico traducido en vez del texto crudo del backend: evita
  // enumeración de usuarios (¿existe este email o no?) y viola la regla de
  // i18n del proyecto si se muestra verbatim.
  const requestCodeError = requestCodeMutation.error
    ? isStatusCode(requestCodeMutation.error, 429)
      ? t('auth:errors.tooManyRequests')
      : t('auth:errors.requestCodeFailed')
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      requestCodeMutation.mutate(email)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <HuemulFieldGroup>
          <HuemulField
            type="email"
            label={t('common:email')}
            name="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(v) => setEmail(v as string)}
            required
            autoComplete="email"
            disabled={lockedEmail}
          />
          <HuemulButton
            type="submit"
            label={requestCodeMutation.isPending ? t('login.sendingCode') : t('login.continueWithEmail')}
            loading={requestCodeMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-[#4464f7] to-[#2f6bff] hover:from-[#3451e6] hover:to-[#2459f0] text-white font-medium shadow-lg shadow-blue-500/30 transition-all"
          />
          {requestCodeError && (
            <FieldDescription className="text-red-600 text-center">
              {requestCodeError}
            </FieldDescription>
          )}
        </HuemulFieldGroup>
      </form>
    </div>
  )
}
