import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { WisecoreLogo } from "@/components/ui/wisecore-logo"
import { FieldDescription } from "@/components/ui/field"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { authService } from "@/services/auth"
import { isStatusCode } from "@/lib/error-utils"
import { AuthLegalFooter } from "@/components/auth/auth-legal-footer"
import type { LoginFormProps } from "@/types/auth"

export type { LoginFormProps } from "@/types/auth"

export function LoginForm({
  className,
  onCodeRequested,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const { t } = useTranslation(['auth', 'common'])

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "login" }),
    onSuccess: () => {
      onCodeRequested?.(email)
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
          <div className="flex flex-col items-center gap-4 text-center">
            <WisecoreLogo size="lg" className="text-[#4464f7]" />

          </div>
          <HuemulField
            type="email"
            label={t('common:email')}
            name="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(v) => setEmail(v as string)}
            required
            autoComplete="email"
          />
          <HuemulButton
            type="submit"
            label={requestCodeMutation.isPending ? t('login.sendingCode') : t('login.continueWithEmail')}
            loading={requestCodeMutation.isPending}
            className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white font-medium py-2.5 transition-colors"
          />
          {requestCodeError && (
            <FieldDescription className="text-red-600 text-center">
              {requestCodeError}
            </FieldDescription>
          )}
        </HuemulFieldGroup>
      </form>
      <AuthLegalFooter />
    </div>
  )
}
