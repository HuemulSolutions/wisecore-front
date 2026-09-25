/**
 * Caso C del login (docs/sso-frontend.md §2): el usuario elige la organización;
 * el método de acceso lo decide la membresía (se muestra como badge, no se elige).
 */
import { useState } from 'react'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { FieldDescription } from '@/components/ui/field'
import { HuemulFieldGroup } from '@/huemul/components/huemul-field'
import { HuemulButton } from '@/huemul/components/huemul-button'
import { AuthMethodBadge } from '@/components/auth/auth-method-badge'
import { authService } from '@/services/auth'
import { isStatusCode } from '@/lib/error-utils'
import type { LoginOrganizationOption, SelectOrganizationResult } from '@/types/auth'

export interface AuthOrganizationPickerProps extends React.ComponentProps<'div'> {
  preauthToken: string
  organizations: LoginOrganizationOption[]
  onSelected: (result: SelectOrganizationResult, organization: LoginOrganizationOption) => void
  onBack?: () => void
}

export function AuthOrganizationPicker({
  className,
  preauthToken,
  organizations,
  onSelected,
  onBack,
  ...props
}: AuthOrganizationPickerProps) {
  const { t } = useTranslation('auth')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const selectMutation = useMutation({
    mutationFn: (organization: LoginOrganizationOption) =>
      authService.selectLoginOrganization({ preauth_token: preauthToken, organization_id: organization.id }),
    onMutate: (organization) => setPendingId(organization.id),
    onSuccess: (result, organization) => onSelected(result, organization),
    onSettled: () => setPendingId(null),
  })

  const selectError = selectMutation.error
    ? isStatusCode(selectMutation.error, 429)
      ? t('errors.tooManyRequests')
      : t('errors.selectOrganizationFailed')
    : null

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <HuemulFieldGroup>
        {onBack && (
          <div className="w-full flex justify-start mb-4">
            <HuemulButton variant="ghost" size="sm" icon={ArrowLeft} iconClassName="h-4 w-4" label={t('otp.back')} onClick={onBack} type="button" />
          </div>
        )}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('chooseOrganization.title')}</h1>
          <FieldDescription className="text-gray-600">{t('chooseOrganization.description')}</FieldDescription>
        </div>
        <ul className="flex flex-col gap-2" aria-label={t('chooseOrganization.title')}>
          {organizations.map((organization) => {
            const methodType = organization.method.kind === 'sso' ? organization.method.type : 'internal'
            const busy = selectMutation.isPending && pendingId === organization.id
            return (
              <li key={organization.id}>
                <button
                  type="button"
                  onClick={() => selectMutation.mutate(organization)}
                  disabled={selectMutation.isPending}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:border-[#4464f7] hover:bg-[#4464f7]/5 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-busy={busy}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#4464f7] text-white">
                      <Building2 className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="truncate font-medium text-gray-900">{organization.name}</span>
                  </span>
                  <AuthMethodBadge type={methodType} name={organization.method.name} />
                </button>
              </li>
            )
          })}
        </ul>
        {selectError && (
          <FieldDescription className="text-red-600 text-center" role="alert">
            {selectError}
          </FieldDescription>
        )}
      </HuemulFieldGroup>
    </div>
  )
}
