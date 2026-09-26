/**
 * Pantalla de transición mientras el navegador va al proveedor de identidad.
 * Si el navegador bloquea la redirección automática, el botón la repite.
 */
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { FieldDescription } from '@/components/ui/field'
import { HuemulFieldGroup } from '@/huemul/components/huemul-field'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { AuthMethodIcon } from '@/components/auth/auth-method-badge'
import type { SsoFlowPayload } from '@/types/auth'

export interface AuthSsoRedirectProps extends React.ComponentProps<'div'> {
  sso: SsoFlowPayload
  onContinue: () => void
  onBack?: () => void
}

export function AuthSsoRedirect({ className, sso, onContinue, onBack, ...props }: AuthSsoRedirectProps) {
  const { t } = useTranslation('auth')
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <HuemulFieldGroup>
        {onBack && (
          <div className="w-full flex justify-start mb-4">
            <HuemulButton variant="ghost" size="sm" icon={ArrowLeft} iconClassName="h-4 w-4" label={t('sso.back')} onClick={onBack} type="button" />
          </div>
        )}
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <span className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AuthMethodIcon type={sso.type} className="h-5 w-5" />
            {t('sso.redirecting', { name: sso.name })}
          </span>
          <Loader2 className="h-6 w-6 animate-spin text-[#4464f7]" aria-hidden />
          <FieldDescription className="text-gray-600">{t('sso.description')}</FieldDescription>
        </div>
        <HuemulButton
          type="button"
          label={t('sso.continueManually')}
          onClick={onContinue}
          className="w-full bg-[#4464f7] hover:bg-[#3451e6] text-white font-medium py-2.5 transition-colors"
        />
      </HuemulFieldGroup>
    </div>
  )
}
