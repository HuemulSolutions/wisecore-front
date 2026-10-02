"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Globe, Lock, Plus, RefreshCw, Search, Shield, ShieldCheck, Trash2, User as UserIcon } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/contexts/organization-context"
import { useRoles } from "@/hooks/useRbac"
import { useMembers } from "@/hooks/useUsers"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { useCollectionAccess, useCollectionMutations } from "@/hooks/useCollections"
import type { Collection, CollectionAccess, CollectionAccessGrant, CollectionAccessLevel } from "@/types/collections"
import { diffCollectionAccess, hasAccessChanges, principalKey } from "./collection-access-diff"
import { CollectionsErrorState } from "./collections-error-state"

export interface CollectionAccessSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Pick<Collection, "id" | "name" | "is_public" | "created_by"> | null
}

/** Fila del borrador: el acceso y su nombre para mostrar (`formerMember` si ya no es miembro). */
type DraftAccess = CollectionAccessGrant & { key: string; label: string; formerMember?: boolean }

const MAX_RESULTS = 8

const personName = (person: { name?: string | null; last_name?: string | null; email?: string | null }) =>
  [person.name, person.last_name].filter(Boolean).join(" ") || person.email || ""

interface SearchOption {
  id: string
  label: string
  detail?: string
}

/**
 * Buscador para agregar: los resultados (solo lo que todavía no tiene acceso) aparecen
 * en un desplegable flotante mientras se escribe. Debajo quedan únicamente los ya agregados.
 */
function PrincipalSearch({
  placeholder,
  value,
  onChange,
  options,
  icon: Icon,
  onPick,
  noMatchesLabel,
  searchingLabel,
  searching = false,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: SearchOption[]
  icon: typeof Shield
  onPick: (option: SearchOption) => void
  noMatchesLabel: string
  searchingLabel?: string
  /** Mientras se espera la respuesta no se ofrecen resultados (serían los de la búsqueda
   * anterior) ni se dice "sin resultados". */
  searching?: boolean
}) {
  const showResults = value.trim() !== ""
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            onChange("")
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
      {showResults && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {(searching || options.length === 0) && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">{searching ? searchingLabel : noMatchesLabel}</p>
          )}
          {!searching && options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onPick(option)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:cursor-pointer hover:bg-muted"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate" title={option.label}>
                  {option.label}
                </span>
                {option.detail && (
                  <span className="block truncate text-xs text-muted-foreground" title={option.detail}>
                    {option.detail}
                  </span>
                )}
              </span>
              <Plus className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * "Quién puede verla": visibilidad (privada o pública) y los roles y personas con acceso, cada
 * bloque con su buscador. En una privada definen quién la ve (lectura) y quién la administra;
 * en una pública todos la leen, así que definen quién la administra. El creador es un acceso
 * más (marcado "Creador"): se le puede quitar o bajar, siempre que quede al menos un
 * administrador. Al guardar viajan solo los cambios (`PATCH /collections/{id}/access` con
 * `{add, remove}`), nunca la lista completa: lo que no se tocó queda como estaba aunque esta
 * pantalla no lo haya cargado. Guardar se habilita recién con los accesos cargados.
 */
export function CollectionAccessSheet({ open, onOpenChange, collection }: CollectionAccessSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const { selectedOrganizationId } = useOrganization()
  const collectionId = collection?.id
  const { data: accessList, error, isLoading, isError, isFetching, refetch } = useCollectionAccess(collectionId, open)
  const accesses = accessList?.accesses
  const { data: rolesData } = useRoles(open, 1, 1000)
  const [roleQuery, setRoleQuery] = useState("")
  const [personQuery, setPersonQuery] = useState("")
  // El directorio se busca en el servidor, con debounce: una llamada por pausa, no por tecla.
  const { debounced: debouncedPersonQuery, isPending: isPersonQueryPending } = useDebouncedSearch(personQuery)
  const { data: membersData, isPlaceholderData: isStaleMembers } = useMembers(
    open && debouncedPersonQuery !== "",
    selectedOrganizationId ?? undefined,
    1,
    20,
    debouncedPersonQuery || undefined,
  )
  const { updateAccess, updateCollection } = useCollectionMutations()
  const [draft, setDraft] = useState<DraftAccess[]>([])
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (open) {
      setIsPublic(collection?.is_public ?? false)
      setRoleQuery("")
      setPersonQuery("")
    }
  }, [open, collection?.is_public])

  useEffect(() => {
    if (open && accesses) setDraft(accesses.map((access) => toDraft(access)))
    // `toDraft` solo depende de `t`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accesses])

  function toDraft(access: CollectionAccess): DraftAccess {
    const label = access.role_id
      ? (access.role_name ?? "")
      : (access.user ? personName(access.user) : "") || t("access.unknownUser", { id: access.user_id!.slice(0, 8) })
    return {
      role_id: access.role_id,
      user_id: access.user_id,
      access_level: access.access_level,
      key: principalKey(access),
      label,
      formerMember: access.user_id ? access.is_member === false : false,
    }
  }

  const roles = useMemo(() => rolesData?.data ?? [], [rolesData])
  const members = useMemo(() => membersData?.data ?? [], [membersData])

  const taken = new Set(draft.map((access) => access.key))
  const roleNeedle = roleQuery.trim().toLowerCase()
  const roleOptions: SearchOption[] = roleNeedle
    ? roles
        .filter((role) => !taken.has(`role:${role.id}`) && role.name.toLowerCase().includes(roleNeedle))
        .slice(0, MAX_RESULTS)
        .map((role) => ({ id: role.id, label: role.name }))
    : []
  const personOptions: SearchOption[] = personQuery.trim()
    ? members
        .filter((member) => !taken.has(`user:${member.id}`))
        .slice(0, MAX_RESULTS)
        .map((member) => ({ id: member.id, label: personName(member), detail: member.email }))
    : []

  const addPrincipal = (kind: "role" | "user", option: SearchOption) => {
    const grant: CollectionAccessGrant = {
      role_id: kind === "role" ? option.id : null,
      user_id: kind === "user" ? option.id : null,
      // En una pública la lectura no agrega nada: lo que se agrega es un administrador.
      access_level: isPublic ? "admin" : "read",
    }
    setDraft((prev) => [...prev, { ...grant, key: principalKey(grant), label: option.label }])
    if (kind === "role") setRoleQuery("")
    else setPersonQuery("")
  }

  const setLevel = (key: string, level: CollectionAccessLevel) =>
    setDraft((prev) => prev.map((access) => (access.key === key ? { ...access, access_level: level } : access)))

  const remove = (key: string) => setDraft((prev) => prev.filter((access) => access.key !== key))

  const adminCount = draft.filter((access) => access.access_level === "admin").length
  const pendingChanges = accesses ? diffCollectionAccess(accesses, draft) : null
  // El backend rechaza dejarla sin administradores; acá se evita llegar a pedirlo.
  const leavesNoAdmins = !!pendingChanges && hasAccessChanges(pendingChanges) && adminCount === 0

  const handleSave = async () => {
    if (!collectionId || !accesses) return
    if (collection && isPublic !== collection.is_public) {
      await updateCollection.mutateAsync({ collectionId, data: { is_public: isPublic } })
    }
    const changes = diffCollectionAccess(accesses, draft)
    if (hasAccessChanges(changes)) await updateAccess.mutateAsync({ collectionId, changes })
  }

  const roleGrants = draft.filter((access) => access.role_id)
  const personGrants = draft.filter((access) => access.user_id)
  const creatorId = accessList?.creator?.user_id

  const grantRow = (access: DraftAccess, Icon: typeof Shield) => {
    // El último administrador no se puede quitar ni bajar a lectura.
    const lastAdmin = access.access_level === "admin" && adminCount === 1
    const readIgnored = isPublic && access.access_level === "read"
    return (
      <li key={access.key} className="flex items-center gap-3 px-3 py-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="block truncate" title={access.label}>
            {access.label}
            {access.user_id && access.user_id === creatorId && (
              <span className="ml-2 text-xs text-muted-foreground">{t("access.creatorTag")}</span>
            )}
            {access.formerMember && <span className="ml-2 text-xs text-muted-foreground">{t("access.formerMember")}</span>}
          </span>
          {readIgnored && <span className="block text-xs text-amber-700">{t("access.readHasNoEffect")}</span>}
        </span>
        <Select
          value={access.access_level}
          onValueChange={(level) => setLevel(access.key, level as CollectionAccessLevel)}
          disabled={access.formerMember}
        >
          <SelectTrigger className="h-8 w-40 hover:cursor-pointer" aria-label={t("access.level")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read" disabled={lastAdmin || (isPublic && !readIgnored)}>
              {t("access.read")}
            </SelectItem>
            <SelectItem value="admin">{t("access.admin")}</SelectItem>
          </SelectContent>
        </Select>
        <HuemulButton
          variant="ghost"
          size="icon"
          icon={Trash2}
          onClick={() => remove(access.key)}
          disabled={lastAdmin}
          aria-label={t("access.remove")}
          tooltip={lastAdmin ? t("access.lastAdmin") : t("access.remove")}
        />
      </li>
    )
  }

  const block = (title: string, search: ReactNode, rows: ReactNode, empty: string, hasRows: boolean) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {search}
      {hasRows ? <ul className="divide-y rounded-md border">{rows}</ul> : <p className="text-xs text-muted-foreground">{empty}</p>}
    </section>
  )

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
      saveAction={{ label: t("common:save"), onClick: handleSave, disabled: !accesses || leavesNoAdmins }}
      headerExtra={
        <HuemulButton
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          icon={RefreshCw}
          aria-label={t("common:refresh")}
          tooltip={t("common:refresh")}
          loading={isFetching}
          onClick={() => refetch()}
        />
      }
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

        {isError ? (
          <CollectionsErrorState compact error={error} onRetry={() => refetch()} />
        ) : (
          isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{isPublic ? t("access.managersTitle") : t("access.whoTitle")}</h3>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? t("access.publicLevelsHint") : t("access.levelsHint")}
                </p>
              </div>
              {adminCount === 0 && (
                <p className="flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {t("access.noAdmins")}
                </p>
              )}
              {block(
                t("access.rolesTitle"),
                <PrincipalSearch
                  placeholder={t("access.searchRole")}
                  value={roleQuery}
                  onChange={setRoleQuery}
                  options={roleOptions}
                  icon={Shield}
                  onPick={(option) => addPrincipal("role", option)}
                  noMatchesLabel={t("access.noMatches")}
                />,
                roleGrants.map((access) => grantRow(access, Shield)),
                t("access.noRoles"),
                roleGrants.length > 0,
              )}
              {block(
                t("access.peopleTitle"),
                <PrincipalSearch
                  placeholder={t("access.searchPerson")}
                  value={personQuery}
                  onChange={setPersonQuery}
                  options={personOptions}
                  icon={UserIcon}
                  onPick={(option) => addPrincipal("user", option)}
                  noMatchesLabel={t("access.noMatches")}
                  searchingLabel={t("access.searching")}
                  searching={isPersonQueryPending || isStaleMembers}
                />,
                personGrants.map((access) => grantRow(access, UserIcon)),
                t("access.noPeople"),
                personGrants.length > 0,
              )}
            </>
          )
        )}
      </div>
    </HuemulSheet>
  )
}
