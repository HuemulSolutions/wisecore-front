import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { WisecoreLogo } from "@/components/ui/wisecore-logo"
import { FieldDescription } from "@/components/ui/field"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { authService } from "@/services/auth"
import { getErrorMessage } from "@/lib/error-utils"
import packageJson from "../../../package.json"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onCodeRequested?: (email: string) => void
}

export function LoginForm({
  className,
  onCodeRequested,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const { t } = useTranslation('auth')

  const requestCodeMutation = useMutation({
    mutationFn: (email: string) =>
      authService.requestCode({ email, purpose: "login" }),
    onSuccess: () => {
      onCodeRequested?.(email)
    },
  })

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
            label={t('login.email')}
            name="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(v) => setEmail(v as string)}
            required
          />
          <HuemulButton
            type="submit"
            label={t('login.continueWithEmail')}
            loading={requestCodeMutation.isPending}
            className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white font-medium py-2.5 transition-colors"
          />
          {requestCodeMutation.error && (
            <FieldDescription className="text-red-600 text-center">
              {getErrorMessage(requestCodeMutation.error)}
            </FieldDescription>
          )}
        </HuemulFieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-sm text-gray-500">
        {t('login.termsText')}{" "}
        <a href="#" className="text-[#4464f7] hover:text-[#3451e6] hover:underline">
          {t('login.termsOfService')}
        </a>{" "}
        {t('login.and')}{" "}
        <a href="#" className="text-[#4464f7] hover:text-[#3451e6] hover:underline">
          {t('login.privacyPolicy')}
        </a>.
      </FieldDescription>
      <div className="text-center text-xs text-gray-400">
        {t('login.version')} {packageJson.version}
      </div>
    </div>
  )
}
