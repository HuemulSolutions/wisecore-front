"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { CreateAuthTypeRequest } from "@/services/auth-types"
import type { AuthTypeKind, Saml2Params } from "@/types/auth-types"
import { Plus } from "lucide-react"
import type { CreateAuthTypeDialogProps } from '@/types/auth-types'

export type { CreateAuthTypeDialogProps } from '@/types/auth-types'

const EMPTY_SAML2: Saml2Params = { client_id: "", tenant_id: "", request_url: "" }

export function CreateAuthTypeDialog({ open, onOpenChange }: CreateAuthTypeDialogProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const [formData, setFormData] = useState<CreateAuthTypeRequest>({
    name: "",
    type: "internal",
    params: null,
  })
  const [saml2Params, setSaml2Params] = useState<Saml2Params>(EMPTY_SAML2)

  const { data: authTypeTypes } = useAuthTypeTypes(open)
  const { createAuthType } = useAuthTypeMutations()

  const isSaml2 = formData.type === "saml2"

  const handleSubmit = async () => {
    const payload: CreateAuthTypeRequest = {
      ...formData,
      params: isSaml2 ? (saml2Params as unknown as Record<string, unknown>) : null,
    }
    await new Promise<void>((resolve, reject) => {
      createAuthType.mutate(payload, {
        onSuccess: () => {
          setFormData({ name: "", type: "internal", params: null })
          setSaml2Params(EMPTY_SAML2)
          resolve()
        },
        onError: (error) => reject(error)
      })
    })
  }

  const handleInputChange = (field: keyof CreateAuthTypeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaml2Change = (field: keyof Saml2Params, value: string) => {
    setSaml2Params(prev => ({ ...prev, [field]: value }))
  }

  const typeOptions = (authTypeTypes ?? []).map((type) => ({
    value: type,
    label: type === "internal" ? t('types.internal') : type === "entra" ? t('types.entra') : type === "saml2" ? t('types.saml2') : type,
  }))

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createDialog.title')}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: t('common:create'),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t('common:name')}
          name="name"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          placeholder={t('createDialog.namePlaceholder')}
          required
        />
        <HuemulField
          type="select"
          label={t('columns.type')}
          name="type"
          value={formData.type}
          options={typeOptions}
          onChange={(value) => handleInputChange("type", value as AuthTypeKind)}
          placeholder={t('createDialog.typePlaceholder')}
        />
        {isSaml2 && (
          <>
            <HuemulField
              label={t('saml2.clientId')}
              name="client_id"
              value={saml2Params.client_id}
              onChange={(value) => handleSaml2Change("client_id", value as string)}
              placeholder={t('saml2.clientIdPlaceholder')}
              required
            />
            <HuemulField
              label={t('saml2.tenantId')}
              name="tenant_id"
              value={saml2Params.tenant_id}
              onChange={(value) => handleSaml2Change("tenant_id", value as string)}
              placeholder={t('saml2.tenantIdPlaceholder')}
              required
            />
            <HuemulField
              label={t('saml2.url')}
              name="request_url"
              value={saml2Params.request_url}
              onChange={(value) => handleSaml2Change("request_url", value as string)}
              placeholder={t('saml2.urlPlaceholder')}
              required
            />
          </>
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}