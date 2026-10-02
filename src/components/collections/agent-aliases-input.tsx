"use client"

import { useId, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip"
import { AGENT_ALIASES_MAX, AGENT_SLUG_MAX_LENGTH, normalizeAgentAlias } from "@/lib/agent-identifiers"
import { cn } from "@/lib/utils"

export interface AgentAliasesInputProps {
  value: string[]
  onChange: (aliases: string[]) => void
  /** Identificador actual: no se acepta como alias (ya es el nombre principal). */
  slug: string
  /** Error del formulario (validación o 409 del backend). */
  error?: string
  disabled?: boolean
}

/**
 * Alias de una colección para agentes: otros nombres con que se la pide ("actúa como auditor").
 * Agrega con Enter o coma, normalizado a kebab-case como el identificador; Backspace con el campo
 * vacío quita el último. El backend valida lo mismo y además que no los use otra colección (409).
 */
export function AgentAliasesInput({ value, onChange, slug, error, disabled = false }: AgentAliasesInputProps) {
  const { t } = useTranslation("collections")
  const id = useId()
  const [draft, setDraft] = useState("")
  const [hint, setHint] = useState<string | undefined>()

  const add = (raw: string) => {
    const typed = raw.trim()
    if (!typed) return
    const alias = normalizeAgentAlias(typed)
    let problem: string | undefined
    if (!alias) problem = t("form.aliasInvalid", { alias: typed })
    else if (value.includes(alias)) problem = t("form.aliasDuplicate", { alias })
    else if (alias === slug.trim()) problem = t("form.aliasSameAsSlug", { alias })
    else if (value.length >= AGENT_ALIASES_MAX) problem = t("form.aliasesMax", { max: AGENT_ALIASES_MAX })
    setHint(problem)
    if (problem) return
    onChange([...value, alias])
    setDraft("")
  }

  const remove = (alias: string) => {
    setHint(undefined)
    onChange(value.filter((item) => item !== alias))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      add(draft)
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  const message = hint ?? error
  const descriptionId = `${id}-description`
  const messageId = `${id}-message`

  return (
    <div role="group" data-slot="huemul-field" data-invalid={!!message || undefined} className="flex w-full flex-col gap-1.5">
      <Label htmlFor={id} className={cn("text-sm font-medium leading-snug", disabled && "opacity-50")}>
        {t("form.aliases")}
      </Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((alias) => (
            <li key={alias}>
              <HuemulTagChip
                label={alias}
                size="sm"
                onRemove={disabled ? undefined : () => remove(alias)}
                removeLabel={t("form.removeAlias", { alias })}
              />
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value.replace(/,/g, ""))
          if (hint) setHint(undefined)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        placeholder={t("form.aliasesPlaceholder")}
        maxLength={AGENT_SLUG_MAX_LENGTH}
        disabled={disabled}
        aria-invalid={!!message || undefined}
        aria-describedby={message ? messageId : descriptionId}
      />
      {message ? (
        <p id={messageId} role="alert" className="text-destructive text-sm font-normal">
          {message}
        </p>
      ) : (
        <p id={descriptionId} className="text-muted-foreground text-sm leading-normal">
          {t("form.aliasesHint")}
        </p>
      )}
    </div>
  )
}
