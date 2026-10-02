"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Crown, Globe, Lock, Plus, Search, Shield, ShieldCheck, Trash2, User as UserIcon } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/contexts/organization-context"
import { useRoles } from "@/hooks/useRbac"
import { useMembers } from "@/hooks/useUsers"
import { useCollectionAccess, useCollectionMutations } from "@/hooks/useCollections"
import type { Collection, CollectionAccess, CollectionAccessLevel } from "@/types/collections"

export interface CollectionAccessSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Pick<Collection, "id" | "name" | "is_public" | "created_by"> | null
}

type DraftAccess = CollectionAccess & { key: string }

const keyOf = (access: Pick<CollectionAccess, "role_id" | "user_id">) =>
  access.role_id ? `role:${access.role_id}` : `user:${access.user_id}`

const MAX_RESULTS = 8

/**
 * "Quién puede verla": visibilidad (privada o pública), quién tiene acceso con su
 * nivel, y un buscador único de roles y personas para agregar. Se guarda todo junto:
 * `PUT /collections/{id}/access` reemplaza los grants y, si cambió, `PUT
 * /collections/{id}` actualiza `is_public`. Roles y personas salen del catálogo
 * abierto (`/rbac/roles`) y del directorio (`/user_roles/members`): no hace falta
 * administrar usuarios para compartir.
 */
export function CollectionAccessSheet({ open, onOpenChange, collection }: CollectionAccessSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const { selectedOrganizationId } = useOrganization()
  const collectionId = collection?.id
  const { data: accesses, isLoading } = useCollectionAccess(collectionId, open)
  const { data: rolesData } = useRoles(open, 1, 1000)
  const [query, setQuery] = useState("")
  const { data: membersData } = useMembers(open, selectedOrganizationId ?? undefined, 1, query ? 20 : 100, query || undefined)
  const { replaceAccess, updateCollection } = useCollectionMutations()
  const [draft, setDraft] = useState<DraftAccess[]>([])
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (open) {
      setIsPublic(collection?.is_public ?? false)
      setQuery("")
    }
  }, [open, collection?.is_public])

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
  const needle = query.trim().toLowerCase()
  const roleResults = roles
    .filter((role) => !taken.has(`role:${role.id}`))
    .filter((role) => !needle || role.name.toLowerCase().includes(needle))
    .slice(0, MAX_RESULTS)
  const personResults = needle
    ? members
        .filter((member) => !taken.has(`user:${member.id}`) && member.id !== collection?.created_by)
        .slice(0, MAX_RESULTS)
    : []

  const addPrincipal = (principal: { role_id?: string; user_id?: string }) => {
    const access: CollectionAccess = {
      role_id: principal.role_id ?? null,
      user_id: principal.user_id ?? null,
      access_level: "read",
    }
    setDraft((prev) => [...prev, { ...access, key: keyOf(access) }])
    setQuery("")
  }

  const setLevel = (key: string, level: CollectionAccessLevel) =>
    setDraft((prev) => prev.map((access) => (access.key === key ? { ...access, access_level: level } : access)))

  const remove = (key: string) => setDraft((prev) => prev.filter((access) => access.key !== key))

  const handleSave = async () => {
    if (!collectionId) return
    if (collection && isPublic !== collection.is_public) {
      await updateCollection.mutateAsync({ collectionId, data: { is_public: isPublic } })
    }
    await replaceAccess.mutateAsync({
      collectionId,
      accesses: draft.map(({ role_id, user_id, access_level }) => ({ role_id, user_id, access_level })),
    })
  }

  const label = (access: DraftAccess) =>
    access.role_id
      ? roleNames.get(access.role_id) ?? t("access.unknownRole", { id: access.role_id.slice(0, 8) })
      : memberNames.get(access.user_id!) ?? t("access.unknownUser", { id: access.user_id!.slice(0, 8) })

  const creatorName = collection?.created_by ? memberNames.get(collection.created_by) : undefined

  const visibilityOptions = [
    { value: false, icon: Lock, title: t("access.privateTitle"), description: t("access.privateDescription") },
    { value: true, icon: Globe, title: t("access.publicTitle"), description: t("access.publicDescription") },
  ]

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("access.title")}
      description={collection?.name}
      icon={ShieldCheck}
      size="lg"
      cancelLabel={t("common:cancel")}
      saveAction={{ label: t("common:save"), onClick: handleSave }}
    >
      <div className="space-y-6 py-2">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t("access.visibilityTitle")}</h3>
          <div role="radiogroup" aria-label={t("access.visibilityTitle")} className="grid gap-3 sm:grid-cols-2">
            {visibilityOptions.map((option) => {
              const selected = isPublic === option.value
              const Icon = option.icon
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setIsPublic(option.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:cursor-pointer",
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-primary" />
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t("access.whoTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("access.levelsHint")}</p>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("access.addLabel")}
              aria-label={t("access.addLabel")}
              className="pl-8"
            />
          </div>
          {(roleResults.length > 0 || personResults.length > 0) && (
            <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
              {roleResults.length > 0 && (
                <div className="p-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("access.rolesGroup")}
                  </p>
                  {roleResults.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => addPrincipal({ role_id: role.id })}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:cursor-pointer hover:bg-muted"
                    >
                      <Shield className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{role.name}</span>
                      <Plus className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
              {personResults.length > 0 && (
                <div className="border-t p-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("access.peopleGroup")}
                  </p>
                  {personResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => addPrincipal({ user_id: member.id })}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:cursor-pointer hover:bg-muted"
                    >
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          {[member.name, member.last_name].filter(Boolean).join(" ") || member.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                      </span>
                      <Plus className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              <li className="flex items-center gap-3 px-3 py-2">
                <Crown className="size-4 shrink-0 text-amber-600" />
                <span className="min-w-0 flex-1 truncate text-sm">{creatorName ?? t("access.creatorUnknown")}</span>
                <span className="text-xs text-muted-foreground">{t("access.creator")}</span>
              </li>
              {draft.map((access) => (
                <li key={access.key} className="flex items-center gap-3 px-3 py-2">
                  {access.role_id ? (
                    <Shield className="size-4 shrink-0 text-muted-foreground" aria-label={t("access.rolesGroup")} />
                  ) : (
                    <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-label={t("access.peopleGroup")} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{label(access)}</span>
                  <Select value={access.access_level} onValueChange={(level) => setLevel(access.key, level as CollectionAccessLevel)}>
                    <SelectTrigger className="h-8 w-40" aria-label={t("access.level")}>
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
          {!isLoading && draft.length === 0 && (
            <p className="text-xs text-muted-foreground">{isPublic ? t("access.publicNote") : t("access.none")}</p>
          )}
        </section>
      </div>
    </HuemulSheet>
  )
}
