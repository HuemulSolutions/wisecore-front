"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Copy, Check, TriangleAlert } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useTokenMutations } from "@/hooks/useTokens"
import type { CreateTokenRequest, CreateTokenResult } from "@/types/tokens"

interface TokenCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

const DURATION_DAYS_OPTIONS = [15, 30, 60, 90, 180] as const

const INITIAL_FORM: CreateTokenRequest = {
  name: "",
  duration_days: 180,
}

export function TokenCreateSheet({ open, onOpenChange, organizationId }: TokenCreateSheetProps) {
  const { t } = useTranslation(["tokens", "common"])
  const durationOptions = DURATION_DAYS_OPTIONS.map((days) => ({
    value: String(days),
    label: t("list.durationDays", { count: days }),
  }))
  const [formData, setFormData] = useState<CreateTokenRequest>(INITIAL_FORM)
  const [createdToken, setCreatedToken] = useState<CreateTokenResult | null>(null)
  const [copied, setCopied] = useState(false)
  const { createToken } = useTokenMutations(organizationId)

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM)
      setCreatedToken(null)
      setCopied(false)
    }
  }, [open])

  const handleChange = <K extends keyof CreateTokenRequest>(
    field: K,
    value: CreateTokenRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      createToken.mutate(formData, {
        onSuccess: (result) => {
          setCreatedToken(result)
          resolve()
        },
        onError: (err) => reject(err),
      })
    })
  }

  const handleCopy = () => {
    if (!createdToken) return
    navigator.clipboard.writeText(createdToken.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdToken) {
    return (
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("reveal.title")}
        icon={Check}
        maxWidth="sm:max-w-lg"
        showCancelButton={false}
        saveAction={{
          label: t("reveal.doneLabel"),
          onClick: () => onOpenChange(false),
        }}
      >
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{t("reveal.warning")}</p>
          </div>
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <code className="text-xs font-mono text-gray-700 break-all flex-1">
              {createdToken.token}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1 rounded hover:bg-muted transition-colors hover:cursor-pointer"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </HuemulSheet>
    )
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      description={t("create.description")}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("create.submitLabel"),
        onClick: handleSubmit,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("common:name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("create.namePlaceholder")}
          required
        />
        <HuemulField
          type="select"
          label={t("create.durationLabel")}
          name="duration_days"
          value={String(formData.duration_days)}
          options={durationOptions}
          onChange={(v) => handleChange("duration_days", Number(v))}
          required
        />
      </HuemulFieldGroup>
    </HuemulSheet>
  )
}
