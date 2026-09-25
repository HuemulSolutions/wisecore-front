import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOrganizationMutations } from "@/hooks/useOrganizations"
import type { Organization, OrganizationDetailsFormApi } from "@/types/organizations"

interface OrganizationDetailsValues {
  name: string
  description: string
  maxUsers: number | null
  tokenLimit: number | null
}

function valuesFromOrganization(organization: Organization): OrganizationDetailsValues {
  return {
    name: organization.name || "",
    description: organization.description || "",
    maxUsers: organization.max_users ?? null,
    tokenLimit: organization.token_limit ?? null,
  }
}

/**
 * Formulario plano del tab "Detalles" — ver `OrganizationDetailsFormApi`.
 * Reemplaza a `EditOrganizationDialog` en ambos consumidores. Hidratación
 * gateada por `isDirty` (ia context/sheet-footer-batch-save-guide.md regla
 * 3): la organización puede refrescarse (ej. invalidación tras marcar admin
 * en el tab Usuarios) mientras el usuario edita nombre/descripción acá.
 *
 * `manageSystemLimits`: solo `/global-admin` (root-admin) lo pasa en `true` —
 * `/organizations` no toca `max_users`/`token_limit`, ni para leerlos ni para
 * enviarlos en el PATCH (quedan `undefined`, el backend no los modifica).
 */
export function useOrganizationDetailsForm(
  organization: Organization | null,
  canUpdate: boolean,
  manageSystemLimits: boolean = false,
): OrganizationDetailsFormApi {
  const { t } = useTranslation('organizations')
  const [values, setValues] = useState<OrganizationDetailsValues>({ name: "", description: "", maxUsers: null, tokenLimit: null })
  const baselineRef = useRef<OrganizationDetailsValues>(values)

  const { updateOrganization } = useOrganizationMutations()

  const isDirty =
    values.name !== baselineRef.current.name ||
    values.description !== baselineRef.current.description ||
    (manageSystemLimits && (
      values.maxUsers !== baselineRef.current.maxUsers ||
      values.tokenLimit !== baselineRef.current.tokenLimit
    ))

  useEffect(() => {
    if (!organization || isDirty) return
    const loaded = valuesFromOrganization(organization)
    baselineRef.current = loaded
    setValues(loaded)
  }, [organization, isDirty])

  const nameError = values.name.trim().length === 0 ? t('detail.nameRequired') : null
  const canSave = isDirty && !nameError

  const discard = useCallback(() => {
    setValues(baselineRef.current)
  }, [])

  const saveRef = useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!organization || !canUpdate || !canSave) return
    const name = values.name.trim()
    const description = values.description.trim()
    await updateOrganization.mutateAsync({
      id: organization.id,
      data: {
        name,
        description: description || undefined,
        ...(manageSystemLimits ? { max_users: values.maxUsers, token_limit: values.tokenLimit } : {}),
      },
    })
    baselineRef.current = { name, description, maxUsers: values.maxUsers, tokenLimit: values.tokenLimit }
  }
  const save = useCallback(() => saveRef.current(), [])

  return {
    name: values.name,
    description: values.description,
    maxUsers: values.maxUsers,
    tokenLimit: values.tokenLimit,
    setName: (v) => setValues((prev) => ({ ...prev, name: v })),
    setDescription: (v) => setValues((prev) => ({ ...prev, description: v })),
    setMaxUsers: (v) => setValues((prev) => ({ ...prev, maxUsers: v })),
    setTokenLimit: (v) => setValues((prev) => ({ ...prev, tokenLimit: v })),
    canSave,
    isDirty,
    isSaving: updateOrganization.isPending,
    nameError,
    save,
    discard,
  }
}
