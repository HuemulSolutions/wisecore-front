"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { useQuery } from '@tanstack/react-query'
import { OrganizationSelectionDialog } from '@/components/organization/organization-selection-dialog'

import { HuemulButton } from "@/huemul/components/huemul-button"
import { getUserOrganizations } from '@/services/organizations'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'

export function OrganizationSwitcher() {
  const [isOrgSelectionOpen, setIsOrgSelectionOpen] = React.useState(false)

  const { selectedOrganizationId, organizations, setOrganizations } = useOrganization()
  const { user } = useAuth()
  const { t } = useTranslation('organizations')

  const { data: organizationsData } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: () => getUserOrganizations(user!.id),
    enabled: !!user?.id,
  })

  React.useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData)
    }
  }, [organizationsData, setOrganizations])

  const selectedOrganization = organizations?.find(org => org.id === selectedOrganizationId)

  const renderButton = () => {
    if (!selectedOrganization) {
      return (
        <HuemulButton
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-12 hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsOrgSelectionOpen(true)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 text-gray-500 font-semibold text-xs shrink-0">
            --
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-gray-500">{t('switcher.selectOrganization')}</span>
            <span className="truncate text-xs text-muted-foreground">{t('switcher.chooseFromList')}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4" />
        </HuemulButton>
      )
    }

    return (
      <HuemulButton
        variant="ghost"
        className="w-full justify-start gap-2 px-2 h-12 hover:bg-accent hover:text-accent-foreground"
        onClick={() => setIsOrgSelectionOpen(true)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#4464f7] text-white font-semibold text-xs shrink-0">
          {selectedOrganization.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{selectedOrganization.name}</span>
          <span className="truncate text-xs text-muted-foreground">{t('switcher.organization')}</span>
        </div>
        <ChevronsUpDown className="ml-auto h-4 w-4" />
      </HuemulButton>
    )
  }

  return (
    <>
      {renderButton()}

      <OrganizationSelectionDialog
        open={isOrgSelectionOpen}
        onOpenChange={setIsOrgSelectionOpen}
        preselectedOrganizationId={selectedOrganizationId || undefined}
      />
    </>
  )
}