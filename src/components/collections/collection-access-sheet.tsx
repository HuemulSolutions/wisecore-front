"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Share2, Shield, Trash2, User as UserIcon } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOrganization } from "@/contexts/organization-context"
import { useRoles } from "@/hooks/useRbac"
import { useMembers } from "@/hooks/useUsers"
import { useCollectionAccess, useCollectionMutations } from "@/hooks/useCollections"
import type { Collection, CollectionAccess, CollectionAccessLevel } from "@/types/collections"

export interface CollectionAccessSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Pick<Collection, "id" | "name" | "is_public"> | null
}

type DraftAccess = CollectionAccess & { key: string }

const keyOf = (access: Pick<CollectionAccess, "role_id" | "user_id">) =>
  access.role_id ? `role:${access.role_id}` : `user:${access.user_id}`

/**
 * Compartir una colección: lectura o administración a roles y personas. Se edita
 * un borrador y se guarda todo junto (`PUT /collections/{id}/access` reemplaza
 * la lista completa). Los roles salen del catálogo abierto (`/rbac/roles`) y las
 * personas del directorio de la organización (`/user_roles/members`), así que no
 * hace falta ser administrador de usuarios para compartir.
 */
export function CollectionAccessSheet({ open, onOpenChange, collection }: CollectionAccessSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const { selectedOrganizationId } = useOrganization()
  const collectionId = collection?.id
  const { data: accesses, isLoading } = useCollectionAccess(collectionId, open)
  const { data: rolesData } = useRoles(open, 1, 1000)
  const [personSearch, setPersonSearch] = useState("")
  const { data: membersData } = useMembers(open, selectedOrganizationId ?? undefined, 1, personSearch ? 20 : 100, personSearch || undefined)
  const { replaceAccess } = useCollectionMutations()
  const [draft, setDraft] = useState<DraftAccess[]>([])

  useEffect(() => {
    if (open && accesses) setDraft(accesses.map((access) => ({ ...access, key: keyOf(access) })))
  }, [open, accesses])

  const roles = useMemo(() => rolesData?.data ?? [], [rolesData])
  const members = useMemo(() => membersData?.data ?? [], [membersData])
  const roleNames = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles])
  const [memberNames, setMemberNames] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    if (members.length === 0) return
    setMemberNames((prev) => {
      const next = new Map(prev)
      for (const member of members) {
        next.set(member.id, [member.name, member.last_name].filter(Boolean).join(" ") || member.email)
      }
      return next
    })
  }, [members])

  const taken = new Set(draft.map((access) => access.key))
  const availableRoles = roles.filter((role) => !taken.has(`role:${role.id}`))
  const availableMembers = members.filter((member) => !taken.has(`user:${member.id}`))

  const addPrincipal = (principal: { role_id?: string; user_id?: string }) => {
    const access: CollectionAccess = {
      role_id: principal.role_id ?? null,
      user_id: principal.user_id ?? null,
      access_level: "read",
    }
    setDraft((prev) => [...prev, { ...access, key: keyOf(access) }])
  }

  const setLevel = (key: string, level: CollectionAccessLevel) =>
    setDraft((prev) => prev.map((access) => (access.key === key ? { ...access, access_level: level } : access)))

  const remove = (key: string) => setDraft((prev) => prev.filter((access) => access.key !== key))

  const handleSave = async () => {
    if (!collectionId) return
    await replaceAccess.mutateAsync({
      collectionId,
      accesses: draft.map(({ role_id, user_id, access_level }) => ({ role_id, user_id, access_level })),
    })
  }

  const label = (access: DraftAccess) =>
    access.role_id
      ? roleNames.get(access.role_id) ?? t("access.unknownRole", { id: access.role_id.slice(0, 8) })
      : memberNames.get(access.user_id!) ?? t("access.unknownUser", { id: access.user_id!.slice(0, 8) })

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("access.title")}
      description={collection?.name}
      icon={Share2}
      size="lg"
      cancelLabel={t("common:cancel")}
      saveAction={{ label: t("common:save"), onClick: handleSave }}
    >
      <div className="space-y-5 py-2">
        <p className="text-sm text-muted-foreground">{t("access.description")}</p>
        {collection?.is_public && (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{t("access.publicNote")}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("access.adminHint")}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value="" onValueChange={(roleId) => addPrincipal({ role_id: roleId })}>
            <SelectTrigger aria-label={t("access.addRole")}>
              <SelectValue placeholder={t("access.addRole")} />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1">
            <Input
              value={personSearch}
              onChange={(event) => setPersonSearch(event.target.value)}
              placeholder={t("access.searchPerson")}
              aria-label={t("access.addPerson")}
            />
            {personSearch.trim() !== "" && availableMembers.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border bg-background shadow-sm">
                {availableMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      addPrincipal({ user_id: member.id })
                      setPersonSearch("")
                    }}
                    className="flex w-full flex-col items-start px-3 py-1.5 text-left text-sm hover:cursor-pointer hover:bg-muted"
                  >
                    <span>{[member.name, member.last_name].filter(Boolean).join(" ") || member.email}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : draft.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("access.none")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {draft.map((access) => (
              <li key={access.key} className="flex items-center gap-3 px-3 py-2">
                {access.role_id ? (
                  <Shield className="size-4 shrink-0 text-muted-foreground" aria-label={t("access.roles")} />
                ) : (
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-label={t("access.people")} />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">{label(access)}</span>
                <Select value={access.access_level} onValueChange={(level) => setLevel(access.key, level as CollectionAccessLevel)}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">{t("access.read")}</SelectItem>
                    <SelectItem value="admin">{t("access.admin")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => remove(access.key)} aria-label={t("access.remove")}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HuemulSheet>
  )
}
