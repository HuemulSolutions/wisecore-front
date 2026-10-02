"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, BookOpen, Compass, Edit, Info, Plus, Users } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useCollectionMutations } from "@/hooks/useCollections"
import {
  AGENT_SLUG_MAX_LENGTH,
  AGENT_USAGE_MAX_LENGTH,
  isConflictError,
  isValidAgentIdentifier,
  suggestAgentIdentifier,
} from "@/lib/agent-identifiers"
import {
  COLLECTION_INSTRUCTIONS_MAX_LENGTH,
  COLLECTION_NAME_MAX_LENGTH,
  type Collection,
  type CollectionAgentKind,
  type CollectionFormData,
} from "@/types/collections"

const EMPTY_FORM: CollectionFormData = {
  name: "",
  description: "",
  instructions: "",
  show_instructions_in_menu: false,
  is_public: false,
  for_agent: false,
  agent_slug: "",
  agent_usage: "",
  agent_kind: "knowledge",
}

function toFormData(collection: Collection | null): CollectionFormData {
  if (!collection) return EMPTY_FORM
  return {
    name: collection.name,
    description: collection.description ?? "",
    instructions: collection.instructions ?? "",
    show_instructions_in_menu: collection.show_instructions_in_menu ?? false,
    is_public: collection.is_public,
    for_agent: collection.for_agent,
    agent_slug: collection.agent_slug ?? "",
    agent_usage: collection.agent_usage ?? "",
    agent_kind: collection.agent_kind,
  }
}

export interface CollectionFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = crear. */
  collection: Collection | null
  /** Permiso para crear/editar colecciones para agentes (`collection_agent:c` o `:u`). */
  canManageAgentCollections: boolean
  onSaved?: (collection: Collection) => void
}

const KIND_OPTIONS: { value: CollectionAgentKind; icon: typeof BookOpen; title: string; description: string; example: string }[] = [
  {
    value: "knowledge",
    icon: BookOpen,
    title: "form.kindKnowledgeTitle",
    description: "form.kindKnowledgeDescription",
    example: "form.kindKnowledgeExample",
  },
  {
    value: "behavior",
    icon: Compass,
    title: "form.kindBehaviorTitle",
    description: "form.kindBehaviorDescription",
    example: "form.kindBehaviorExample",
  },
]

export function CollectionFormSheet({
  open,
  onOpenChange,
  collection,
  canManageAgentCollections,
  onSaved,
}: CollectionFormSheetProps) {
  const { t } = useTranslation(["collections", "common"])
  const [formData, setFormData] = useState<CollectionFormData>(() => toFormData(collection))
  const [errors, setErrors] = useState<Partial<Record<keyof CollectionFormData, string>>>({})
  const { createCollection, updateCollection } = useCollectionMutations()
  const isEdit = !!collection
  // El identificador sigue al nombre hasta que el usuario lo edita a mano. Una
  // colección que ya tiene identificador no se toca: los agentes ya la piden así.
  const [slugTouched, setSlugTouched] = useState(() => !!collection?.agent_slug)

  useEffect(() => {
    if (open) {
      setFormData(toFormData(collection))
      setErrors({})
      setSlugTouched(!!collection?.agent_slug)
    }
  }, [open, collection])

  const handleChange = <K extends keyof CollectionFormData>(field: K, value: CollectionFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "name" && prev.for_agent && !slugTouched) {
        next.agent_slug = suggestAgentIdentifier(String(value))
      }
      return next
    })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleAudienceChange = (audience: "human" | "agent") => {
    const forAgent = audience === "agent"
    setFormData((prev) => ({
      ...prev,
      for_agent: forAgent,
      // Al pasar a agentes se sugiere el identificador desde el nombre si está vacío.
      agent_slug: forAgent && !slugTouched ? suggestAgentIdentifier(prev.name) : prev.agent_slug,
    }))
  }

  const validate = () => {
    const next: Partial<Record<keyof CollectionFormData, string>> = {}
    if (!formData.name.trim()) next.name = t("form.nameRequired")
    if (formData.for_agent) {
      const slug = formData.agent_slug.trim()
      if (!slug) next.agent_slug = t("form.slugRequired")
      else if (!isValidAgentIdentifier(slug)) next.agent_slug = t("form.slugInvalid")
      if (!formData.agent_usage.trim()) next.agent_usage = t("form.usageRequired")
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) throw new Error("invalid")
    const body = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      instructions: formData.instructions.trim() || null,
      show_instructions_in_menu: formData.show_instructions_in_menu,
      // La visibilidad se cambia en "Quién puede verla"; al crear, privada.
      ...(isEdit ? {} : { is_public: false }),
      for_agent: formData.for_agent,
      ...(formData.for_agent
        ? {
            agent_slug: formData.agent_slug.trim(),
            agent_usage: formData.agent_usage.trim(),
            agent_kind: formData.agent_kind,
          }
        : {}),
    }
    try {
      const saved = isEdit
        ? await updateCollection.mutateAsync({ collectionId: collection!.id, data: body })
        : await createCollection.mutateAsync({ ...body, description: body.description ?? undefined, instructions: body.instructions ?? undefined })
      onSaved?.(saved)
    } catch (error) {
      if (isConflictError(error)) {
        setErrors((prev) => ({ ...prev, agent_slug: t("form.slugConflict", { slug: formData.agent_slug.trim() }) }))
      }
      throw error
    }
  }

  // Una colección que ya es para agentes solo la edita quien tiene el permiso de agentes.
  const agentLocked = !canManageAgentCollections
  const instructionsPlaceholder = !formData.for_agent
    ? t("form.instructionsPlaceholderHuman")
    : formData.agent_kind === "behavior"
      ? t("form.instructionsPlaceholderBehavior")
      : t("form.instructionsPlaceholderKnowledge")

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("form.editTitle") : t("form.createTitle")}
      icon={isEdit ? Edit : Plus}
      size="lg"
      cancelLabel={t("common:cancel")}
      saveAction={{ label: isEdit ? t("common:update") : t("common:create"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("form.name")}
          name="name"
          value={formData.name}
          onChange={(value) => handleChange("name", value as string)}
          placeholder={t("form.namePlaceholder")}
          error={errors.name}
          maxLength={COLLECTION_NAME_MAX_LENGTH}
          required
        />
        <HuemulField
          type="textarea"
          label={t("form.description")}
          name="description"
          value={formData.description}
          onChange={(value) => handleChange("description", value as string)}
          description={t("form.descriptionHint")}
          rows={2}
        />

        <div className="space-y-1.5">
          <span className="text-sm font-medium">{t("form.audience")}</span>
          <HuemulSegmentedControl
            value={formData.for_agent ? "agent" : "human"}
            onChange={handleAudienceChange}
            ariaLabel={t("form.audience")}
            options={[
              { value: "human", label: t("form.audienceHuman"), icon: Users },
              {
                value: "agent",
                label: t("form.audienceAgent"),
                icon: Bot,
                disabled: agentLocked && !formData.for_agent,
                title: agentLocked ? t("form.audienceAgentForbidden") : undefined,
              },
            ]}
            disabled={agentLocked && formData.for_agent}
          />
          <p className="text-xs text-muted-foreground">
            {agentLocked && !formData.for_agent ? t("form.audienceAgentForbidden") : formData.for_agent ? t("form.audienceAgentHint") : null}
          </p>
        </div>

        {formData.for_agent && (
          <>
            <div className="space-y-2">
              <span className="text-sm font-medium">{t("form.kind")}</span>
              <div role="radiogroup" aria-label={t("form.kind")} className="grid gap-3 sm:grid-cols-2">
                {KIND_OPTIONS.map((option) => {
                  const selected = formData.agent_kind === option.value
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={agentLocked}
                      onClick={() => handleChange("agent_kind", option.value)}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors hover:cursor-pointer",
                        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                        agentLocked && "pointer-events-none opacity-60",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="size-4 text-primary" />
                        {t(option.title)}
                      </span>
                      <span className="text-xs text-foreground/80">{t(option.description)}</span>
                      <span className="text-xs italic text-muted-foreground">{t(option.example)}</span>
                    </button>
                  )
                })}
              </div>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {t("form.kindNotARole")}
              </p>
            </div>

            <HuemulField
              label={t("form.slug")}
              name="agent_slug"
              value={formData.agent_slug}
              onChange={(value) => {
                setSlugTouched(true)
                handleChange("agent_slug", value as string)
              }}
              placeholder={t("form.slugPlaceholder")}
              description={t("form.slugHint")}
              error={errors.agent_slug}
              maxLength={AGENT_SLUG_MAX_LENGTH}
              disabled={agentLocked}
              required
            />
            <HuemulField
              type="textarea"
              label={t("form.usage")}
              name="agent_usage"
              value={formData.agent_usage}
              onChange={(value) => handleChange("agent_usage", value as string)}
              placeholder={t("form.usagePlaceholder")}
              description={t("form.usageHint")}
              error={errors.agent_usage}
              rows={3}
              maxLength={AGENT_USAGE_MAX_LENGTH}
              showCharCount
              disabled={agentLocked}
              required
            />
          </>
        )}

        <Separator />

        <HuemulField
          type="textarea"
          label={t("form.instructions")}
          name="instructions"
          value={formData.instructions}
          onChange={(value) => handleChange("instructions", value as string)}
          placeholder={instructionsPlaceholder}
          description={t("form.instructionsHint")}
          rows={10}
          maxLength={COLLECTION_INSTRUCTIONS_MAX_LENGTH}
          showCharCount
          disabled={formData.for_agent && agentLocked}
        />
        <p className="-mt-2 flex items-start gap-1.5 text-xs text-amber-700">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t("form.instructionsNotApproved")}
        </p>
        {!formData.for_agent && (
          <HuemulField
            type="switch"
            label={t("form.instructionsInMenu")}
            name="show_instructions_in_menu"
            value={formData.show_instructions_in_menu}
            onChange={(value) => handleChange("show_instructions_in_menu", Boolean(value))}
            description={t("form.instructionsInMenuHint")}
          />
        )}

      </HuemulFieldGroup>
    </HuemulSheet>
  )
}
